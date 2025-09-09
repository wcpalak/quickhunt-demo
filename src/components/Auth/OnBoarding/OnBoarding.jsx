import React, {useEffect, useState} from 'react';
import Step1 from './Steps/Step1';
import Step2 from './Steps/Step2';
import Step3 from './Steps/Step3';
import {Icon} from "../../../utils/Icon";
import ThankYou from "./Steps/ThankYou";
import {useLocation, useNavigate} from "react-router-dom";
import {baseUrl, getTokenVerify, loadCrisp} from "../../../utils/constent";

const OnBoarding = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const UrlParams = new URLSearchParams(location.search);
    const stepType = UrlParams.get("step") || 1;
    const [step, setStep] = useState(Number(stepType) <= 3 ? Number(stepType) : 1);
    const [progress, setProgress] = useState(0);
    const [selectedCreate, setSelectedCreate] = useState('');
    const [selectedKnowAbout, setSelectedKnowAbout] = useState('');

    useEffect(() => {
        loadCrisp();
    }, [step]);

    useEffect(() => {
        if(!getTokenVerify()){
            navigate(`${baseUrl}/login`, { replace: true });
            return;
        }
        navigate(`${baseUrl}/onboarding?step=${step}`);
    },[step])

    useEffect(() => {
        if (!getTokenVerify()) return;

        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('step', step);
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState(null, '', newUrl);

        const progressMap = {
            1: 0,
            2: 33.33,
            3: 66.66,
            4: 100
        };
        setProgress(progressMap[step] || 0);
    }, [step]);

    return (
        <div>
            <div className="h-full">
                <div className="ltr">
                    <div>
                        <div className={"min-h-screen bg-background overflow-hidden w-full"}>
                            <div className={"min-h-screen flex w-full justify-center items-center overflow-y-auto p-5"}>
                                <div className={"flex flex-col items-start gap-4 max-w-[490px] w-full "}>
                                    <div>{Icon.blueLogo}</div>
                                    <div className={"w-full space-y-8"}>
                                        <div className={"space-y-5"}>
                                            {
                                                step == 1 && <Step1 {...{setStep ,progress ,step}}/>
                                            }

                                            {
                                                step == 2 &&  <Step2
                                                    setStep={setStep}
                                                    progress={progress}
                                                    step={step}
                                                    selectedCreate={selectedCreate}
                                                    setSelectedCreate={setSelectedCreate}
                                                    selectedKnowAbout={selectedKnowAbout}
                                                    setSelectedKnowAbout={setSelectedKnowAbout}
                                                />
                                            }

                                            {
                                                step == 3 && <Step3 {...{setStep ,progress ,step, setProgress}}/>
                                            }

                                            {
                                                step == 4 && <ThankYou {...{setStep}}/>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnBoarding;
