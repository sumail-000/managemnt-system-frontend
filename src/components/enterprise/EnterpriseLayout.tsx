// DEPRECATED: This legacy enterprise layout has been removed in favor of NewEnterpriseLayout.
// This file intentionally exports a minimal pass-through layout to avoid breaking any stray imports.

import { Outlet } from "react-router-dom";

export function EnterpriseLayout() {
  return <Outlet />;
}

export default EnterpriseLayout;
