import { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { isEmpty } from "../../utils/constent";

const TourContext = createContext();

export function TourProvider({ children }) {
  const [tourStep, setTourStep] = useState(null); // null = not started
  const userDetailsReducer = useSelector(state => state.userDetailsReducer);

  useEffect(() => {
    // Only start tour if not completed earlier
    if (!isEmpty(userDetailsReducer?.userTourStep)) {
      setTourStep(Number(userDetailsReducer?.userTourStep)); // start tour from first step
    }
  }, [userDetailsReducer?.userTourStep]);

  return (
    <TourContext.Provider value={{ tourStep, setTourStep  }}>
      {children}
    </TourContext.Provider>
  );
}

export const useTour = () => useContext(TourContext);
