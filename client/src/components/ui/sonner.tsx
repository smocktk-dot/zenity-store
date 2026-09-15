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
          "--normal-bg": "rgba(11, 13, 12, 0.97)",
          "--normal-text": "#e7e9ea",
          "--normal-border": "rgba(255, 255, 255, 0.09)",
        } as React.CSSProperties
      }
      toastOptions={{
        className: "!rounded-2xl !border !shadow-2xl !font-medium !text-sm",
        classNames: {
          toast: "group toast-card",
          title: "text-white font-semibold",
          description: "text-gray-400 text-xs",
          actionButton: "!bg-emerald-600 !text-white !rounded-lg !px-3 !py-1.5 !text-xs !font-semibold",
          cancelButton: "!bg-white/5 !text-gray-300 !border !border-white/10 !rounded-lg !px-3 !py-1.5 !text-xs",
          closeButton: "!text-gray-500 hover:!text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
