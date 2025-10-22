import { NavLink } from "react-router-dom";

type NavigationButtonProps = {
  label: string;
  to: string;
};

function NavigationButton({ label, to }: NavigationButtonProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `btn btn-nav ${isActive ? "active" : ""}`
      }
    >
      {label}
    </NavLink>
  );
}

export default NavigationButton;
