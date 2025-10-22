import React from "react";
import "../styles/components/button.css"; // ✅ fix đường dẫn: không có dấu cách

type Variant = "cancel" | "delete" | "submit" | "approve" | "detail";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  hidden?: boolean;
};

const getLoadingLabel = (variant: Variant) => {
  switch (variant) {
    case "approve":
      return "Approving...";
    case "delete":
      return "Deleting...";
    case "submit":
      return "Submitting...";
    case "cancel":
      return "Cancelling...";
    default:
      return "Loading...";
  }
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "submit",
      loading,
      hidden,
      className,
      disabled,
      type,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type || "button"} // ✅ fix: mặc định là button, không bị submit form
        className={`btn btn-${variant} ${hidden ? "hidden" : ""} ${
          className ?? ""
        }`}
        disabled={disabled || loading}
        aria-busy={loading}
        {...rest}
      >
        {loading ? getLoadingLabel(variant) : children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
