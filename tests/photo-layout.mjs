import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

const source = readFileSync('app/page.tsx', 'utf8');
const geometry = source.slice(source.indexOf('const SLOT_GAP'), source.indexOf('\nfunction roundedPath'));
const context = {};
vm.runInNewContext(stripTypeScriptTypes(geometry) + '\nresult = { getBaseSlots, getSlots };', context);
const { getBaseSlots, getSlots } = context.result;
for (const layout of ['single', 'split-v', 'split-h', 'hero-side', 'hero-bottom', 'grid', 'seamless-grid', 'cross', 'masonry', 'cluster', 'timeline', 'polaroid', 'adaptive']) {
  for (let count = 1; count <= 4; count++) {
    const base = getBaseSlots(layout, count);
    for (const [width, height, rotation] of [[1600, 900, 0], [900, 1600, 0], [1600, 900, 90]]) {
      for (const scale of [0.1, 1, 2]) {
        const photo = { image: { naturalWidth: width, naturalHeight: height }, frameScale: scale, offsetX: 0.1, offsetY: -0.1, rotation };
        const slots = getSlots(layout, count, Array.from({ length: count }, () => photo));
        assert.equal(slots.length, count);
        slots.forEach((slot, index) => {
          const ratio = rotation ? height / width : width / height;
          assert.ok(Math.abs(slot.w / slot.h - ratio) < 1e-10);
          assert.ok(Math.abs(slot.x + slot.w / 2 - (base[index].x + base[index].w / 2 + 0.1)) < 1e-10);
          assert.ok(Math.abs(slot.y + slot.h / 2 - (base[index].y + base[index].h / 2 - 0.1)) < 1e-10);
          if (scale === 1) assert.ok(slot.w <= base[index].w + 1e-10 && slot.h <= base[index].h + 1e-10);
        });
      }
    }
  }
}
console.log('All layouts retain image proportions across resize, movement and rotation.');
