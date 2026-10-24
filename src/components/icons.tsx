import type { ComponentType, ReactNode, SVGProps } from 'react';

/**
 * ScoutPath's own icon set, drawn on a 24px grid in a plain ink line.
 * Each icon takes the same props the app has always passed: size, strokeWidth,
 * className, style and aria attributes.
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: number | string;
  strokeWidth?: number | string;
}

export type IconComponent = ComponentType<IconProps>;

function draw(name: string, art: ReactNode): IconComponent {
  function DrawnIcon({ size = 24, strokeWidth = 1.75, className, ...rest }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className ? `icon ${className}` : 'icon'}
        focusable="false"
        {...rest}
      >
        {art}
      </svg>
    );
  }
  DrawnIcon.displayName = name;
  return DrawnIcon;
}

const p = (d: string) => <path d={d} />;
const ring = <circle cx="12" cy="12" r="8.5" />;

/* Arrows: drawn with a slight hand wobble on the shaft. */
export const ArrowRight = draw('ArrowRight', p('M4 12.4c4.6-.3 9.4-.5 14.5-.3M13.5 7l5.2 5.1-5.2 5'));
export const ArrowLeft = draw('ArrowLeft', p('M20 12.4c-4.6-.3-9.4-.5-14.5-.3M10.5 7 5.3 12.1l5.2 5'));
export const ArrowUp = draw('ArrowUp', p('M12.4 20c-.3-4.6-.5-9.4-.3-14.5M7 10.5l5.1-5.2 5 5.2'));
export const ArrowDown = draw('ArrowDown', p('M12.4 4c-.3 4.6-.5 9.4-.3 14.5M7 13.5l5.1 5.2 5-5.2'));
export const ChevronDown = draw('ChevronDown', p('m6 9.5 6 5.5 6-5.5'));
export const CornerDownLeft = draw('CornerDownLeft', p('M19 5v6a3 3 0 0 1-3 3H5M9 10l-4 4 4 4'));

/* Marks */
export const Check = draw('Check', p('m5 12.5 4.5 4.5L19 6.5'));
export const X = draw('X', p('M6 6l12 12M18 6 6 18'));
export const Plus = draw('Plus', p('M12 5v14M5 12h14'));
export const Minus = draw('Minus', p('M5 12h14'));
export const Menu = draw('Menu', p('M4 7h16M4 12h11M4 17h16'));

/* Search */
export const Search = draw('Search', <>{<circle cx="10.5" cy="10.5" r="6" />}{p('m15 15 5 5')}</>);
export const SearchX = draw('SearchX', <>{<circle cx="10.5" cy="10.5" r="6" />}{p('m15 15 5 5M8.5 8.5l4 4M12.5 8.5l-4 4')}</>);
export const ScanSearch = draw('ScanSearch', <>{p('M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4')}{<circle cx="11.5" cy="11.5" r="3.5" />}{p('m14 14 2.5 2.5')}</>);

/* Links and files */
export const ExternalLink = draw('ExternalLink', p('M13 5h6v6M19 5l-8 8M17 14v5H5V7h5'));
export const Link2 = draw('Link2', p('M9 12h6M10 8H7.5a4 4 0 0 0 0 8H10M14 8h2.5a4 4 0 0 1 0 8H14'));
export const Bookmark = draw('Bookmark', p('M7 4h10v16l-5-3.5L7 20z'));
export const Copy = draw('Copy', p('M8 8h11v12H8zM5 16V4h11'));
export const Printer = draw('Printer', p('M7 9V4h10v5M7 17H4v-7h16v7h-3M7 14h10v6H7z'));
export const Download = draw('Download', p('M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14'));
export const Upload = draw('Upload', p('M12 15V4M7.5 8.5 12 4l4.5 4.5M5 20h14'));
export const FileText = draw('FileText', p('M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 12h6M9 15.5h6'));
export const Newspaper = draw('Newspaper', p('M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 8.5h7M7 12h7M7 15.5h4'));
export const Image = draw('Image', <>{p('M4 5h16v14H4zM4 16l4.5-4.5 3.5 3.5 2.5-2.5L20 17')}{<circle cx="15.5" cy="9" r="1.5" />}</>);
export const Video = draw('Video', p('M3.5 6.5h12v11h-12zM15.5 10.5l5-3v9l-5-3'));
export const Mic = draw('Mic', <>{<rect x="9" y="3.5" width="6" height="10" rx="3" />}{p('M6 11a6 6 0 0 0 12 0M12 17v3.5M9 20.5h6')}</>);
export const Globe = draw('Globe', <>{ring}{p('M3.5 12h17M12 3.5c-3 3-3 14 0 17M12 3.5c3 3 3 14 0 17')}</>);
export const MousePointerClick = draw('MousePointerClick', p('M9 9l9.5 3.8-4.3 1.4-1.4 4.3zM4 4l2 2M9.5 3v2.5M3 9.5h2.5'));
export const Shapes = draw('Shapes', <>{p('M4 13h7v7H4zM10 3l4 6.5H6z')}{<circle cx="16.5" cy="16.5" r="3.5" />}</>);
export const FlaskConical = draw('FlaskConical', p('M9.5 3.5h5M10.5 3.5v5L5 19a1 1 0 0 0 .9 1.5h12.2a1 1 0 0 0 .9-1.5l-5.5-10.5v-5M7.5 14.5h9'));

/* Books and notes */
export const BookOpen = draw('BookOpen', p('M12 6.5C9.5 5 6.5 4.5 3.5 5v13c3-.5 6 0 8.5 1.5 2.5-1.5 5.5-2 8.5-1.5V5c-3-.5-6 0-8.5 1.5zM12 6.5V19'));
export const BookA = draw('BookA', p('M5 4.5h11.5a2.5 2.5 0 0 1 2.5 2.5v13H7.5A2.5 2.5 0 0 1 5 17.5zM5 17.5A2.5 2.5 0 0 1 7.5 15H19M9.5 12l2.5-6 2.5 6M10.3 10h3.4'));
export const BookMarked = draw('BookMarked', p('M5 4.5h12v15.5H7.5A2.5 2.5 0 0 1 5 17.5zM5 17.5A2.5 2.5 0 0 1 7.5 15H17M10 4.5v6l2-1.5 2 1.5v-6'));
export const Library = draw('Library', p('M5 4v16M9 4v16M13.5 5 18 19.5M3 20h18'));
export const NotebookPen = draw('NotebookPen', p('M6 3.5h11v17H6zM4 7.5h3M4 12h3M4 16.5h3M10 8h4M10 11.5h4'));
export const PenLine = draw('PenLine', p('M4 20l1-4.5L15.5 5 19 8.5 8.5 19zM13.5 7 17 10.5M14 20h6'));
export const MessageSquare = draw('MessageSquare', p('M4 5h16v11H9l-5 4z'));

/* Status */
export const Info = draw('Info', <>{ring}{p('M12 11v5.5M12 7.8v.4')}</>);
export const TriangleAlert = draw('TriangleAlert', p('M12 3.5l9 16H3zM12 9.5V14M12 16.8v.4'));
export const CircleHelp = draw('CircleHelp', <>{ring}{p('M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 16.8v.4')}</>);
export const CircleCheck = draw('CircleCheck', <>{ring}{p('m8 12.3 2.8 2.8L16 9.5')}</>);
export const CircleDashed = draw('CircleDashed', <circle cx="12" cy="12" r="8.5" strokeDasharray="3 3" />);
export const CircleDot = draw('CircleDot', <>{ring}{<circle cx="12" cy="12" r="2" fill="currentColor" />}</>);
export const ShieldCheck = draw('ShieldCheck', p('M12 3.5 19 6v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM8.5 12l2.5 2.5 4.5-4.5'));
export const Lock = draw('Lock', p('M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3'));
export const Hourglass = draw('Hourglass', p('M6.5 3.5h11M6.5 20.5h11M7.5 3.5c0 5 9 6 9 8.5s-9 3.5-9 8.5M16.5 3.5c0 5-9 6-9 8.5s9 3.5 9 8.5'));

/* Controls and layout */
export const Settings = draw('Settings', <>{<circle cx="12" cy="12" r="5" />}{<circle cx="12" cy="12" r="1.8" />}{p('M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8')}</>);
export const SlidersHorizontal = draw('SlidersHorizontal', <>{p('M4 7h9M17 7h3M4 17h3M11 17h9')}{<circle cx="15" cy="7" r="2" />}{<circle cx="9" cy="17" r="2" />}</>);
export const LayoutDashboard = draw('LayoutDashboard', p('M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z'));
export const LayoutGrid = draw('LayoutGrid', p('M4 4h7v7H4zM13 4h7v7h-7zM13 13h7v7h-7zM4 13h7v7H4z'));
export const List = draw('List', p('M9 6h11M9 12h11M9 18h11M4.5 6h.5M4.5 12h.5M4.5 18h.5'));
export const ListChecks = draw('ListChecks', p('M11 6h9M11 12h9M11 18h9M4 6l1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17'));
export const Layers = draw('Layers', p('M12 4l9 4.5-9 4.5-9-4.5zM3 13l9 4.5 9-4.5'));
export const CalendarDays = draw('CalendarDays', p('M4 6h16v14H4zM4 10h16M8 3.5v4M16 3.5v4M8 14h.5M12 14h.5M16 14h.5M8 17h.5M12 17h.5'));
export const CalendarPlus = draw('CalendarPlus', p('M4 6h16v14H4zM4 10h16M8 3.5v4M16 3.5v4M12 12.5v5M9.5 15h5'));
export const RefreshCw = draw('RefreshCw', p('M19.5 9A8 8 0 0 0 5 7.5M4.5 15A8 8 0 0 0 19 16.5M5 3.5v4h4M19 20.5v-4h-4'));
export const RotateCcw = draw('RotateCcw', p('M4.5 12A7.5 7.5 0 1 0 7 6.5L4.5 9M4.5 4.5V9H9'));
export const Shuffle = draw('Shuffle', p('M4 7h3c4 0 6 10 10 10h3M4 17h3c1.5 0 2.7-1.4 3.8-3.2M13.2 10.2C14.3 8.4 15.5 7 17 7h3M17.5 4.5 20 7l-2.5 2.5M17.5 14.5 20 17l-2.5 2.5'));
export const Trash2 = draw('Trash2', p('M4 6.5h16M9 6.5V4h6v2.5M6 6.5l1 14h10l1-14M10 10.5v6M14 10.5v6'));
export const HardDrive = draw('HardDrive', p('M3.5 13.5 6 5.5h12l2.5 8v5h-17zM3.5 13.5h17M7 16.2h.5M10 16.2h.5'));
export const FolderOpen = draw('FolderOpen', p('M3.5 18.5v-12h6l2 2h8v3M3.5 18.5h14l3-7H7z'));
export const FolderPlus = draw('FolderPlus', p('M3.5 6h6l2 2h9v11h-17zM12 11v5M9.5 13.5h5'));
export const Flag = draw('Flag', p('M6 21V4M6 4.5c3-1.5 5 1 8 0s4-1 4-1v8s-1.5 1-4 1-5-2-8 0'));
export const Users = draw('Users', <>{<circle cx="9" cy="8" r="3.2" />}{<circle cx="17" cy="9" r="2.5" />}{p('M3.5 19.5c.5-3.5 2.8-5.5 5.5-5.5s5 2 5.5 5.5M16.5 14c2.4 0 4 1.7 4.3 4.5')}</>);
export const Hand = draw('Hand', p('M9 12V5a1.5 1.5 0 0 1 3 0v6M12 10.5V4a1.5 1.5 0 0 1 3 0v7M15 10.5V6a1.5 1.5 0 0 1 3 0v8c0 4-2.5 7-6.5 7-2.5 0-4-1-5.5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.6L9 14'));

/* Scouting: ranks, badges and topics */
export const GraduationCap = draw('GraduationCap', p('M12 5l10 4.5-10 4.5L2 9.5zM6 11.5V16c1.5 1.5 3.5 2.5 6 2.5s4.5-1 6-2.5v-4.5M21 10v5'));
export const Award = draw('Award', <>{<circle cx="12" cy="9" r="5" />}{p('M8.5 12.5 7 20.5l5-2.5 5 2.5-1.5-8')}</>);
export const Medal = draw('Medal', <>{p('M8 3.5l4 7 4-7M6.5 3.5h3.5M14 3.5h3.5')}{<circle cx="12" cy="15.5" r="5" />}</>);
export const Trophy = draw('Trophy', p('M7.5 4h9v5a4.5 4.5 0 0 1-9 0zM7.5 6h-3c0 3 1.5 4.5 3.5 4.7M16.5 6h3c0 3-1.5 4.5-3.5 4.7M12 13.5V17M9.5 17h5v3.5h-5z'));
export const Tent = draw('Tent', p('M2.5 20h19M12 4.5 4 20M12 4.5 20 20M12 13l-3.5 7M12 13l3.5 7'));
export const Leaf = draw('Leaf', p('M5 19C5 10 10 5 19.5 4.5 19 14 14 19 5 19zM5 19c3-4 6-7 10-9.5'));
export const Waves = draw('Waves', p('M3 8c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0M3 12.5c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0M3 17c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0'));
export const HeartPulse = draw('HeartPulse', p('M12 20s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.2-8 11-8 11zM5 12.5h3.5l1.5-3 2.5 6 1.5-3H19'));
export const Landmark = draw('Landmark', p('M3.5 9 12 4l8.5 5zM5.5 9.5v8M9.5 9.5v8M14.5 9.5v8M18.5 9.5v8M3.5 20h17M4.5 17.5h15'));
export const Atom = draw('Atom', <>{<ellipse cx="12" cy="12" rx="9" ry="3.5" />}{<ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" />}{<ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)" />}{<circle cx="12" cy="12" r="1.2" fill="currentColor" />}</>);
export const Palette = draw('Palette', <>{p('M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 1.8-.8 1.8-1.7 0-1.4-1-1.6-1-2.8 0-.9.7-1.5 1.7-1.5H17a3.5 3.5 0 0 0 3.5-3.5c0-4.2-3.8-7.5-8.5-7.5z')}{<circle cx="8" cy="10.5" r="1" />}{<circle cx="11.5" cy="7.5" r="1" />}{<circle cx="15.5" cy="9" r="1" />}</>);
export const Hammer = draw('Hammer', p('M13 6.5l4.5-3 3 3-3 4.5M15 9l-9.5 9.5a1.4 1.4 0 0 1-2-2L13 7'));
