import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState, useRef } from "react";
import { useTour } from "./TourProvider";
import { apiService, tourSteps, useWindowSize, baseUrl, trackEvent } from "../../utils/constent";
import { useSelector } from "react-redux";
export default function TourWrapper() {
  const { tourStep, setTourStep } = useTour();
  const location = useLocation();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const [coords, setCoords] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState("bottom"); // bottom | top | center
  const [arrowPosition, setArrowPosition] = useState("center"); // left | right | center
  const [extraCoords, setExtraCoords] = useState([]);
  const [searchParams] = useSearchParams();
  const isfromOnboarding = searchParams.get("fromOnboarding") === "true";
  const debounceTimeoutRef = useRef(null);
  const prevCoordsRef = useRef(null);
  const userDetailsReducer = useSelector(state => state.userDetailsReducer);

  const calculateCoords = useCallback(() => {
    if (isfromOnboarding || tourStep === null || tourStep >= tourSteps.length) return;
    const step = tourSteps[tourStep];
    if (location.pathname !== step.page) return;

    const el = document.querySelector(step.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const left = rect.left + window.scrollX;

      const newCoords = {
        top,
        left,
        width: rect.width,
        height: rect.height,
      };

      // Only update if coordinates actually changed significantly (prevents micro-jumps)
      if (!prevCoordsRef.current ||
        Math.abs(prevCoordsRef.current.top - newCoords.top) > 2 ||
        Math.abs(prevCoordsRef.current.left - newCoords.left) > 2 ||
        Math.abs(prevCoordsRef.current.width - newCoords.width) > 2 ||
        Math.abs(prevCoordsRef.current.height - newCoords.height) > 2) {

        setCoords(newCoords);
        prevCoordsRef.current = newCoords;
      }

      // Arrow position
      if (rect.left < window.innerWidth / 3) {
        setArrowPosition("left");
      } else if (rect.right > (window.innerWidth * 2) / 3) {
        setArrowPosition("right");
      } else {
        setArrowPosition("center");
      }

      // Tooltip position (flip if no space)
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (step.position === "center") {
        setTooltipPosition("center");
      } else if (spaceBelow < 160 && spaceAbove > 160) {
        setTooltipPosition("top");
      } else {
        setTooltipPosition("bottom");
      }

      // Handle extra selectors (like sidebar)
      if (step.extraSelectors && step.extraSelectors.length > 0) {
        const coordsList = step.extraSelectors
          .map((sel) => {
            const element = document.querySelector(sel);
            if (!element) return null;
            const rect = element.getBoundingClientRect();
            const top = rect.top + window.scrollY;
            const left = rect.left + window.scrollX;
            return {
              top,
              left,
              width: rect.width,
              height: rect.height,
            };
          })
          .filter(Boolean);

        setExtraCoords(coordsList);
      } else {
        setExtraCoords([]);
      }
    } else {
      setCoords(null);
      setExtraCoords([]);
      if (width <= 1279 && (tourStep === 0 || tourStep === 1)) {
        setTimeout(() => calculateCoords(), 900);
      }
      if (width <= 1279 && (tourStep === 5)) {
        setTimeout(() => calculateCoords(), 500);
      }
      // setTimeout(() => calculateCoords(), 900);
    }
  }, [tourStep, location]);

  // Debounced coordinate calculation
  const debouncedCalculateCoords = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      calculateCoords();
    }, 16); // ~60fps
  }, [calculateCoords]);

  // Run on step/page change
  useEffect(() => {
    calculateCoords();
  }, [calculateCoords, width, tourStep, location]);

  // Navigate to correct page when tour step changes (auto-start)
  useEffect(() => {
    if (tourStep !== null && tourStep >= 0 && tourStep < tourSteps.length && !isfromOnboarding) {
      const currentPage = location.pathname;
      const targetPage = tourSteps[tourStep].page;

      const hasVisitedMigration = localStorage.getItem(`hasVisitedMigration_${userDetailsReducer?.id}`);
      if (currentPage !== targetPage && !hasVisitedMigration && userDetailsReducer?.stripeStatus !== null) {
        navigate(`${baseUrl}${targetPage}`);
      }
    }
  }, [tourStep, navigate, location.pathname, isfromOnboarding]);

  useEffect(() => {
    window.addEventListener("resize", debouncedCalculateCoords);
    window.addEventListener("scroll", debouncedCalculateCoords, true);

    return () => {
      window.removeEventListener("resize", debouncedCalculateCoords);
      window.removeEventListener("scroll", debouncedCalculateCoords, true);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [debouncedCalculateCoords, width]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  if (tourStep === null || tourStep >= tourSteps.length || isfromOnboarding) {
    return null;
  }
  const step = tourSteps[tourStep];
  if (step.page && location.pathname !== step.page) return null;

  const endTour = async () => {
    setTourStep(null);
    const data = await apiService.updateUserTourStep({ step: 7 });
  };

  const handleNext = async () => {
    const next = tourStep + 1;
    if (next < tourSteps.length) {
      setTourStep(next);
      navigate(tourSteps[next].page);
      const data = await apiService.updateUserTourStep({ step: next });
    } else {
      endTour();
    }
  };

  const handleBack = () => {
    const prev = tourStep - 1;
    if (prev >= 0) {
      setTourStep(prev);
      navigate(tourSteps[prev].page);
    }
  };

  const handleSkip = () => {
    trackEvent("ProductTour", { skip: true, step: tourStep });
    endTour();
  };

  const getCombinedClipPath = () => {
    const padding = 8;
    const allCoords = [coords, ...extraCoords].filter(Boolean);

    const segments = allCoords.map((c) => {
      const top = c.top - padding;
      const left = c.left - padding;
      const right = left + c.width + padding * 2;
      const bottom = top + c.height + padding * 2;
      const borderRadius = 3;

      return `
        ${left}px 0%, 
        ${left}px ${top + borderRadius}px, 
        ${left + borderRadius}px ${top}px, 
        ${right - borderRadius}px ${top}px, 
        ${right}px ${top + borderRadius}px, 
        ${right}px ${bottom - borderRadius}px, 
        ${right - borderRadius}px ${bottom}px, 
        ${left + borderRadius}px ${bottom}px, 
        ${left}px ${bottom - borderRadius}px, 
        ${left}px 0%
      `;
    });

    return `polygon(
      0% 0%, 0% 100%, 100% 100%, 100% 0%, 
      ${segments.join(',')}
    )`;
  };

  return (
    <>
      {/* Backdrop with spotlight cutout */}
      {(coords || extraCoords.length > 0) && (
        <div
          className="fixed inset-0 z-[61] pointer-events-auto bg-black/80 transition-all duration-300 ease-out"
          style={{
            WebkitClipPath: getCombinedClipPath(),
            clipPath: getCombinedClipPath(),
            // backgroundColor: '#7c3aed26'
          }}
        // onClick={handleSkip}
        >
        </div>
      )}

      {/* Tooltip */}
      {coords && (
        <div
          className="fixed z-[61] bg-white shadow-xl rounded-xl p-5 w-80 max-w-[90%] border border-gray-300 transition-all duration-300 ease-out"
          style={{
            top:
              tooltipPosition === "bottom"
                ? coords.top + coords.height + 19
                : tooltipPosition === "top"
                  ? coords.top - 193
                  : window.innerHeight / 2 - 100,
            left:
              tooltipPosition === "center"
                ? window.innerWidth / 2 - 160
                : arrowPosition === "left"
                  ? Math.max(20, coords.left)
                  : Math.min(
                    window.innerWidth - 340,
                    coords.left + coords.width - 300
                  ),
          }}
        >
          {/* Arrow */}
          {tooltipPosition !== "center" && (
            <div
              className={`absolute w-0 h-0 border-l-8 border-r-8 border-transparent transition-all duration-300 ease-out`}
              style={{
                left:
                  arrowPosition === "left"
                    ? 20
                    : arrowPosition === "right"
                      ? "unset"
                      : "50%",
                right: arrowPosition === "right" ? 20 : "unset",
                transform:
                  arrowPosition === "center" ? "translateX(-50%)" : "none",
                ...(tooltipPosition === "bottom"
                  ? { top: -8, borderBottom: "8px solid white" }
                  : { bottom: -8, borderTop: "8px solid white" }),
              }}
            />
          )}

          <span className="text-gray-500 text-sm absolute top-2 right-2">{tourStep + 1}/{tourSteps.length}</span>

          <h4 className="font-semibold text-lg mb-2 text-gray-800">{step.title}</h4>
          <p className="mb-4 text-gray-600 text-sm">{step.content}</p>

          <div className={`flex ${tourStep === 0 ? "justify-end" : "justify-between"} mt-2`}>
            <button
              disabled={tourStep === 0}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${tourStep === 0
                ? "hidden"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              onClick={handleBack}
            >
              Back
            </button>

            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={handleSkip}
              >
                Skip
              </button>
              <button
                className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleNext}
              >
                {tourStep === tourSteps.length - 1 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
