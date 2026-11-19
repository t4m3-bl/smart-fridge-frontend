import type {ReactNode} from "react";

export type IconName =
    "refrigerator"
    | "plus"
    | "settings"
    | "check"
    | "cloud-off"
    | "arrowLeft"
    | "eye"
    | "eye-off"
    | "package-open"
    | "sliders-horizontal"
    | "search"
    | "camera"
    | "pencil"
    | "x"
    | "calendar"
    | "flashlight"
    | "info"
    | "chevron-down";

const ICON_PATHS: Record<IconName, ReactNode> = {
  refrigerator: (
      <>
        <path d="M5 6a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Z"/>
        <path d="M5 10h14"/>
        <path d="M15 7v6"/>
      </>
  ),
  plus: (
      <>
        <path d="M5 12h14"/>
        <path d="M12 5v14"/>
      </>
  ),
  settings: (
      <>
        <path
            d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/>
        <circle cx="12" cy="12" r="3"/>
      </>
  ),
  check: <path d="M20 6 9 17l-5-5"/>,
  "cloud-off": (
      <>
        <path d="M10.94 5.274A7 7 0 0 1 15.71 10h1.79a4.5 4.5 0 0 1 4.222 6.057"/>
        <path d="M18.796 18.81A4.5 4.5 0 0 1 17.5 19H9A7 7 0 0 1 5.79 5.78"/>
        <path d="m2 2 20 20"/>
      </>
  ),

  arrowLeft: (
      <path d="M14.5 6 8.5 12l6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
            strokeLinejoin="round"/>),
  eye: (
      <>
        <path d="M1.8 12s3.72-6.6 10.2-6.6S22.2 12 22.2 12s-3.72 6.6-10.2 6.6S1.8 12 1.8 12Z"/>
        <circle cx="12" cy="12" r="3.12"/>
      </>
  ),
  "eye-off":
      <>
        <path d="M3.6 5.4 19.8 19.2"/>
        <path d="M1.8 12s3.72-6.6 10.2-6.6c1.2 0 2.28.12 3.24.48M22.2 12s-3.72 6.6-10.2 6.6c-1.2 0-2.28-.12-3.24-.48"/>
        <circle cx="12" cy="12" r="3.12"/>
      </>,
  "package-open":
      <>
        <path d="M12 22V13" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <path
            d="M15.17 2.20999C15.4191 2.07074 15.6997 1.99762 15.985 1.99762C16.2704 1.99762 16.5509 2.07074 16.8 2.20999L21 4.56999C21.2975 4.7382 21.5449 4.98236 21.7171 5.27752C21.8893 5.57269 21.98 5.90828 21.98 6.24999C21.98 6.59171 21.8893 6.9273 21.7171 7.22246C21.5449 7.51763 21.2975 7.76179 21 7.92999L8.82 14.79C8.5702 14.9325 8.28759 15.0074 8 15.0074C7.71242 15.0074 7.4298 14.9325 7.18 14.79L3 12.43C2.70255 12.2618 2.45509 12.0176 2.28291 11.7225C2.11073 11.4273 2.02 11.0917 2.02 10.75C2.02 10.4083 2.11073 10.0727 2.28291 9.77752C2.45509 9.48236 2.70255 9.23819 3 9.06999L15.17 2.20999Z"
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <path
            d="M20 13V16.87C20.0004 17.2474 19.8971 17.6178 19.7013 17.9405C19.5056 18.2632 19.2249 18.5259 18.89 18.7L12.89 21.78C12.6151 21.9229 12.3098 21.9975 12 21.9975C11.6902 21.9975 11.3849 21.9229 11.11 21.78L5.11 18.7C4.77508 18.5259 4.49443 18.2632 4.29868 17.9405C4.10293 17.6178 3.99961 17.2474 4 16.87V13"
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <path
            d="M21 12.43C21.2975 12.2618 21.5449 12.0176 21.7171 11.7225C21.8893 11.4273 21.98 11.0917 21.98 10.75C21.98 10.4083 21.8893 10.0727 21.7171 9.77753C21.5449 9.48236 21.2975 9.2382 21 9.07L8.83 2.2C8.58189 2.05791 8.30093 1.98315 8.015 1.98315C7.72908 1.98315 7.44812 2.05791 7.2 2.2L3 4.57C2.70255 4.7382 2.45509 4.98236 2.28291 5.27753C2.11073 5.57269 2.02 5.90828 2.02 6.25C2.02 6.59171 2.11073 6.9273 2.28291 7.22247C2.45509 7.51764 2.70255 7.7618 3 7.93L15.18 14.79C15.428 14.9325 15.709 15.0075 15.995 15.0075C16.281 15.0075 16.562 14.9325 16.81 14.79L21 12.43Z"
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </>,
  "sliders-horizontal":
      <>
        <path d="M21 4H14" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 4H3" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12H12" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 12H3" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 20H16" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 20H3" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2V6" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 10V14" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 18V22" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </>,
  "search":
      <>
        <path d="M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 21L16.7 16.7" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </>,
  camera:
      <>
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/>
        <circle cx="12" cy="13" r="3"/>
      </>,
  pencil:
      <>
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
        <path d="m15 5 4 4"/>
      </>,
  x:
      <>
        <path d="M18 6 6 18"/>
        <path d="m6 6 12 12"/>
      </>,
  calendar:
      <>
        <path d="M8 2v4"/>
        <path d="M16 2v4"/>
        <rect width="18" height="18" x="3" y="4" rx="2"/>
        <path d="M3 10h18"/>
      </>,
  flashlight:
      <>
        <path d="M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V2h12z"/>
        <path d="M6 6h12"/>
        <path d="M12 12h.01"/>
      </>,
  info:
      <>
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </>,
  "chevron-down":
      <>
        <path d="m6 9 6 6 6-6"/>
      </>
};

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
};

export function Icon({name, size = 24, className}: IconProps) {
  return (
      <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={className}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
      >
        {ICON_PATHS[name]}
      </svg>
  );
}
