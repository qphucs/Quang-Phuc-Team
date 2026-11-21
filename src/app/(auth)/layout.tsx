import { APP_NAME } from "@/lib/copy";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-sm bg-brand text-h3 font-bold text-ink">
            QP
          </span>
          <span className="text-h3 font-bold text-ink">{APP_NAME}</span>
        </div>
        <div className="rounded-md border border-line bg-white p-6">{children}</div>
      </div>
    </main>
  );
}
