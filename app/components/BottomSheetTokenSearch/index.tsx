import { memo, useRef, useState, useEffect } from "react";
import { FixedSizeList as List, areEqual } from "react-window";
import {
  motion,
  animate,
  useTransform,
  useMotionValue,
  AnimatePresence,
  useMotionTemplate,
  useMotionValueEvent,
} from "framer-motion";

import {
  Modal,
  Button,
  Dialog,
  Heading,
  ModalOverlay,
  Input,
  Label,
} from "react-aria-components";
import { tokenList } from "~/tokenList";
import type { Token } from "~/types";

const Row = memo(
  ({
    index,
    style,
    data,
  }: {
    index: number;
    style: React.CSSProperties;
    data: Token[];
  }) => {
    const item = data[index];

    return (
      <div style={style}>
        <button className="w-full text-left px-4 py-4 flex items-center">
          <img
            alt={item.symbol}
            src={item.logoURI}
            className="rounded-full"
            style={{ width: "3rem", height: "3rem" }}
          />
          &nbsp;&nbsp;&nbsp;
          <span className="flex flex-col">
            <span className="text-lg leading-5 font-semibold">
              {item.symbol}
            </span>
            <span className="text-m text-slate-600 leading-5">{item.name}</span>
          </span>
        </button>
      </div>
    );
  },
  areEqual
);

Row.displayName = "Row";

const MotionModal = motion(Modal);
const MotionModalOverlay = motion(ModalOverlay);

const inertiaTransition = {
  timeConstant: 300,
  bounceDamping: 40,
  bounceStiffness: 300,
  type: "inertia" as const,
};

const staticTransition = {
  duration: 0.5,
  ease: [0.32, 0.72, 0, 1],
};

const SHEET_MARGIN = 34;
const SHEET_RADIUS = 12;

export function BottomSheetTokenSearch() {
  const [suggestions, setSuggestions] = useState(tokenList);

  const rootRef = useRef<HTMLElement>();
  const windowRef = useRef<Window>();
  useEffect(() => {
    rootRef.current = document.body.firstChild as HTMLElement;
    windowRef.current = window;
  }, []);

  const windowHeight = windowRef.current?.innerHeight || 844; // 844 is the default height of the iPhone 12 Pro
  const windowWidth = windowRef.current?.innerWidth || 390; // 390 is the default width of the iPhone 12 Pro
  const [isOpen, setOpen] = useState(true);
  const h = windowHeight - SHEET_MARGIN;
  const y = useMotionValue(h);
  const bgOpacity = useTransform(y, [0, h], [0.4, 0]);
  const bg = useMotionTemplate`rgba(0, 0, 0, ${bgOpacity})`;

  // Scale the body down and adjust the border radius when the sheet is open.
  const bodyScale = useTransform(
    y,
    [0, h],
    [(windowWidth - SHEET_MARGIN) / windowWidth, 1]
  );

  const bodyTranslate = useTransform(
    y,
    [0, h],
    [SHEET_MARGIN - SHEET_RADIUS, 0]
  );
  const bodyBorderRadius = useTransform(y, [0, h], [SHEET_RADIUS, 0]);

  useMotionValueEvent(bodyScale, "change", (v) => {
    if (rootRef.current) {
      rootRef.current.style.scale = `${v}`;
    }
  });

  useMotionValueEvent(bodyTranslate, "change", (v) => {
    if (rootRef.current) {
      rootRef.current.style.translate = `0 ${v}px`;
    }
  });

  useMotionValueEvent(bodyBorderRadius, "change", (v) => {
    if (rootRef.current) {
      rootRef.current.style.borderRadius = `${v}px`;
    }
  });

  const motionModalRef = useRef<HTMLElement | SVGElement | null>(null);

  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 390,
    height: 844,
  });

  useEffect(() => {
    const width = window.innerWidth || 390;
    const height = motionModalRef.current?.clientHeight || 844;

    setDimensions({ width, height });
  }, []);

  return (
    <>
      <Button
        onPress={() => setOpen(true)}
        className="text-blue-600 text-lg font-semibold outline-none rounded bg-transparent border-none pressed:text-blue-700 focus-visible:ring"
      >
        Open sheet
      </Button>
      <AnimatePresence>
        {isOpen && (
          <MotionModalOverlay
            // Force the modal to be open when AnimatePresence renders it.
            isOpen
            onOpenChange={setOpen}
            className="fixed inset-0 z-10"
            style={{ backgroundColor: bg as any }}
          >
            <MotionModal
              initial={{ y: h }}
              animate={{ y: 0 }}
              exit={{ y: h }}
              transition={staticTransition}
              style={{
                y,
                top: SHEET_MARGIN,
                // Extra padding at the bottom to account for rubber band scrolling.
                paddingBottom: window.screen.height,
              }}
              drag="y"
              dragConstraints={{ top: 0 }}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > window.innerHeight * 0.75 || velocity.y > 130) {
                  setOpen(false);
                } else {
                  animate(y, 0, { ...inertiaTransition, min: 0, max: 0 });
                }
              }}
              className="bg-[--page-background] absolute bottom-0 w-full rounded-t-xl shadow-lg will-change-transform"
              ref={motionModalRef}
            >
              <div className="mx-auto w-12 mt-2 h-1.5 rounded-full bg-gray-400" />
              <Dialog className="outline-none">
                <Heading slot="title" className="sr-only">
                  Find any token on Solana.
                </Heading>
                <div className="border-b border-purple-400 py-4 w-full">
                  <Label className="sr-only">Search</Label>
                  <div className="flex items-center ml-4">
                    <span className="absolute left-[28px]">🔍</span>
                    <Input
                      placeholder="Search…"
                      className="border rounded-full pl-9 h-10 w-full"
                      onChange={(e) => {
                        console.log(e.target.value);
                        const results = tokenList.filter((item) => {
                          return item.symbol
                            .toLowerCase()
                            .includes(e.target.value.toLowerCase());
                        });
                        console.log(results);
                        setSuggestions(results);
                      }}
                    />
                    <Button
                      onPress={() => setOpen(false)}
                      className="px-4 py-2 text-purple-600 text-lg font-semibold outline-none rounded bg-transparent border-none pressed:text-blue-700 focus-visible:ring"
                    >
                      Close
                    </Button>
                  </div>
                </div>
                <div
                  onScroll={() => {
                    console.log("scroll");
                  }}
                >
                  <List
                    className=""
                    height={dimensions.height + 20}
                    itemCount={suggestions.length}
                    itemSize={70}
                    width={dimensions.width}
                    itemData={suggestions}
                    overscanCount={10}
                  >
                    {Row}
                  </List>
                </div>
              </Dialog>
            </MotionModal>
          </MotionModalOverlay>
        )}
      </AnimatePresence>
    </>
  );
}
