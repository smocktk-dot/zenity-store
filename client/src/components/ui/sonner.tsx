import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      expand
      richColors={false}
      closeButton
      duration={5000}
      className="toaster group"
      style={
        {
          "--normal-bg": "rgba(13, 10, 25, 0.95)",
          "--normal-text": "#f3f4f6",
          "--normal-border": "rgba(124, 58, 237, 0.35)",
        } as React.CSSProperties
      }
      toastOptions={{
        className: "!rounded-xl !border !shadow-2xl !font-medium !text-sm",
        classNames: {
          toast: "group toast-card",
          title: "text-white font-semibold",
          description: "text-gray-300 text-xs",
          actionButton: "!bg-violet-600 !text-white !rounded-lg !px-3 !py-1.5 !text-xs !font-semibold",
          cancelButton: "!bg-white/5 !text-gray-300 !border !border-white/10 !rounded-lg !px-3 !py-1.5 !text-xs",
          closeButton: "!text-gray-500 hover:!text-white !bg-transparent",
          success: "!border-l-4 !border-l-green-500 !border-white/10",
          error: "!border-l-4 !border-l-red-500 !border-white/10",
          info: "!border-l-4 !border-l-blue-500 !border-white/10",
          warning: "!border-l-4 !border-l-yellow-500 !border-white/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
