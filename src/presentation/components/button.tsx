import React from "react";
import "../styles/components/button.css";

type Variant = "cancel" | "delete" | "submit" | "approve" | "detail" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  hidden?: boolean;
  fullWidth?: boolean;
};

const VARIANT_CLASS: Record<Variant, string> = {
  submit: "btn--primary",
  cancel: "btn--neutral",
  delete: "btn--danger",
  approve: "btn--success",
  detail: "btn--secondary",
  ghost: "btn--ghost",
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

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

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
      fullWidth,
      ...rest
    },
    ref
  ) => {
    const variantClass = VARIANT_CLASS[variant] ?? VARIANT_CLASS.submit;

    return (
      <button
        ref={ref}
        type={type || "button"}
        className={cx(
          "btn",
          variantClass,
          hidden && "btn--hidden",
          fullWidth && "btn--block",
          className
        )}
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
