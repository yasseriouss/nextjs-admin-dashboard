import {
  AlphabetIcon,
  HomeIcon,
  PieChartIcon,
  TableIcon,
  UserIcon,
  Widget4Icon,
  WindowIcon,
} from "./icon";
import {
  Building2,
  Users,
  Sparkles,
  Sliders,
} from "lucide-react";

export const NAV_DATA = [
  {
    label: "REAL ESTATE CRM (6O)",
    items: [
      {
        title: "Properties",
        icon: <Building2 className="size-[18px]" />,
        items: [
          {
            title: "Overview",
            url: "/overview",
          },
          {
            title: "Sales Inventory",
            url: "/sales",
          },
          {
            title: "Rent Inventory",
            url: "/rent",
          },
          {
            title: "Sales Reports",
            url: "/reports",
          },
          {
            title: "Compound Map",
            url: "/map",
          },
          {
            title: "GIS Regional Map",
            url: "/geo",
          },
        ],
      },
      {
        title: "Operations & Sales",
        icon: <Users className="size-[18px]" />,
        items: [
          {
            title: "Clients & Leads",
            url: "/clients",
          },
          {
            title: "Tasks & Workload",
            url: "/tasks",
          },
          {
            title: "Contracts & Commissions",
            url: "/contracts",
          },
          {
            title: "Property Owners",
            url: "/owners",
          },
          {
            title: "Calendar & Viewings",
            url: "/calendar",
          },
        ],
      },
      {
        title: "AI & Content Studio",
        icon: <Sparkles className="size-[18px]" />,
        items: [
          {
            title: "Gemini Copilot",
            url: "/gemini",
          },
          {
            title: "Blog & Articles",
            url: "/articles",
          },
          {
            title: "Landing Page CMS",
            url: "/landing-page-cms",
          },
        ],
      },
      {
        title: "System Settings",
        url: "/settings",
        icon: <Sliders className="size-[18px]" />,
        items: [],
      },
    ],
  },
  {
    label: "NEXTADMIN UI KIT",
    items: [
      {
        title: "Dashboard",
        icon: <HomeIcon />,
        items: [
          {
            title: "E-commerce",
            url: "/",
          },
        ],
      },   
      {
        title: "Profile",
        url: "/profile",
        icon: <UserIcon />,
        items: [],
      },
      {
        title: "Forms",
        icon: <AlphabetIcon />,
        items: [
          {
            title: "Form Elements",
            url: "/form-elements",
          },
        ],
      },
      {
        title: "Tables",
        icon: <TableIcon />,
        items: [
          {
            title: "Basic Tables",
            url: "/tables/basic-tables",
          },
        ],
      },
      {
        title: "Pages",
        icon: <WindowIcon />,
        items: [
          {
            title: "Error Page",
            url: "/error-page",
          },
          {
            title: "Terms & Conditions",
            url: "/terms-and-conditions",
          },
          {
            title: "Mail Success",
            url: "/mail-success",
          },
        ],
      },
    ],
  },
  {
    label: "COMPONENTS",
    items: [
      {
        title: "Charts",
        icon: <PieChartIcon />,
        items: [
          {
            title: "Line Charts",
            url: "/charts/line-charts",
          },
          {
            title: "Bar Charts",
            url: "/charts/bar-charts",
          },
          {
            title: "Pie Charts",
            url: "/charts/pie-charts",
          },
        ],
      },
      {
        title: "UI Elements",
        icon: <Widget4Icon />,
        items: [
          {
            title: "Accordion",
            url: "/ui-elements/accordion",
          },
          {
            title: "Avatars",
            url: "/ui-elements/avatars",
          },
          {
            title: "Buttons",
            url: "/ui-elements/buttons",
          },
          {
            title: "Breadcrumbs",
            url: "/ui-elements/breadcrumbs",
          },
          {
            title: "Progress",
            url: "/ui-elements/progress",
          },
          {
            title: "Tooltips",
            url: "/ui-elements/tooltips",
          },
        ],
      },
    ],
  },
];
