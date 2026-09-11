"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Without this, any render error leaves a blank white page and the teacher has
 * no way back except guessing at a reload. Photos live only in memory, so they
 * are gone either way; the job here is to say so plainly and offer the reset.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("成長日誌發生未預期的錯誤", error);
  }, [error]);

  return (
    <main className="error-shell">
      <div className="error-card">
        <h1>畫面發生了問題</h1>
        <p>
          可以按下面的按鈕重新開始。已經加入的照片不會被保留，但照片從頭到尾都只在這台裝置上，
          沒有被傳送出去。
        </p>
        <Button onClick={reset}>
          <RefreshCw aria-hidden="true" />
          重新開始
        </Button>
        {error.digest ? <p className="error-digest">錯誤代碼：{error.digest}</p> : null}
      </div>
    </main>
  );
}
