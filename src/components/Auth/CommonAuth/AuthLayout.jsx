import React from 'react';
import { Icon } from '../../../utils/Icon';
import authImageWebp from '../../../img/authImage2.webp';
import { brandingURL } from "../../../utils/constent";

const AuthLayout = ({ children }) => {

    return (
        <div className="h-full">
            <div className="ltr">
                <div className="min-h-screen bg-background flex items-center overflow-hidden w-full">
                    <div className="min-h-screen basis-full flex w-full justify-center overflow-y-auto">
                        <div className="min-h-screen basis-1/2 bg-purple-400 w-full relative hidden xl:flex justify-center p-16">
                            <div className="custom-width">
                                <div className="h-full flex flex-col justify-center">
                                    <div className="cursor-pointer" onClick={() => window.open(brandingURL, "_blank")}>{Icon.whiteLogo}</div>

                                    <div className="mt-[8px] mb-[8px] max-w-[706px] w-full">
                                        <img
                                            className="w-full h-auto mb-6"
                                            src={authImageWebp}
                                            alt="Authentication illustration"
                                            height={"646"}
                                        />
                                        <p className="text-white text-center mt-4 text-lg">
                                            Empower your SaaS business with Quickhunt's all-in-one platform for feedback,
                                            roadmaps, and changelogs to engage users and drive product growth.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="min-h-screen md:basis-1/2 md:p-16 flex justify-center items-center bg-card">
                            <div className="lg:w-[641px] h-full">
                                <div className="w-full h-full pt-5">{children}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;