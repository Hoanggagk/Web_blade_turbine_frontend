import React from "react";
import "../styles/components/toolbar.css";

type Justify = "start" | "between" | "end";

type ToolbarProps = React.HTMLAttributes<HTMLDivElement> & {
  stacked?: boolean;
  justify?: Justify;
};

type SectionProps = React.HTMLAttributes<HTMLDivElement>;

type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const ToolbarRoot = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ className, stacked, justify = "start", ...rest }, ref) => {
    const classes = cx(
      "toolbar",
      stacked && "toolbar--stacked",
      justify === "between" && "toolbar--spread",
      justify === "end" && "toolbar--end",
      className
    );

    return <div ref={ref} className={classes} {...rest} />;
  }
);

ToolbarRoot.displayName = "Toolbar";

const ToolbarSection = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("toolbar__section", className)} {...rest} />
  )
);

ToolbarSection.displayName = "Toolbar.Section";

const ToolbarActions = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("toolbar__actions", className)} {...rest} />
  )
);

ToolbarActions.displayName = "Toolbar.Actions";

const ToolbarSearch = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cx("toolbar__search", className)} {...rest} />
  )
);

ToolbarSearch.displayName = "Toolbar.Search";

const ToolbarSearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, type = "search", ...rest }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cx("toolbar__search-input", className)}
      {...rest}
    />
  )
);

ToolbarSearchInput.displayName = "Toolbar.SearchInput";

export const Toolbar = Object.assign(ToolbarRoot, {
  Section: ToolbarSection,
  Actions: ToolbarActions,
  Search: ToolbarSearch,
  SearchInput: ToolbarSearchInput,
});

export default Toolbar;
