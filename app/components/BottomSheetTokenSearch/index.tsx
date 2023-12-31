import { useRef, useState, useEffect } from "react";
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
} from "react-aria-components";

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
  const rootRef = useRef<HTMLElement>();
  const windowRef = useRef<Window>();
  useEffect(() => {
    rootRef.current = document.body.firstChild as HTMLElement;
    windowRef.current = window;
  }, []);

  const windowHeight = windowRef.current?.innerHeight || 844; // 844 is the default height of the iPhone 12 Pro
  const windowWidth = windowRef.current?.innerWidth || 390; // 390 is the default width of the iPhone 12 Pro
  const [isOpen, setOpen] = useState(false);
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
                if (offset.y > window.innerHeight * 0.75 || velocity.y > 10) {
                  setOpen(false);
                } else {
                  animate(y, 0, { ...inertiaTransition, min: 0, max: 0 });
                }
              }}
              className="bg-[--page-background] absolute bottom-0 w-full rounded-t-xl shadow-lg will-change-transform"
            >
              {/* drag affordance */}
              <div className="mx-auto w-12 mt-2 h-1.5 rounded-full bg-gray-400" />
              <Dialog className="px-4 pb-4 outline-none">
                <div className="flex justify-end">
                  <Button
                    onPress={() => setOpen(false)}
                    className="text-blue-600 text-lg font-semibold mb-8 outline-none rounded bg-transparent border-none pressed:text-blue-700 focus-visible:ring"
                  >
                    Done
                  </Button>
                </div>
                <Heading slot="title" className="text-3xl font-semibold mb-4">
                  Modal sheet
                </Heading>
                <p className="text-lg mb-4">
                  This is a dialog with a custom modal overlay built with React
                  Aria Components and Framer Motion.
                </p>
                <p className="text-lg">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  Aenean sit amet nisl blandit, pellentesque eros eu,
                  scelerisque eros. Sed cursus urna at nunc lacinia dapibus.
                </p>
              </Dialog>
            </MotionModal>
          </MotionModalOverlay>
        )}
      </AnimatePresence>
    </>
  );
}
