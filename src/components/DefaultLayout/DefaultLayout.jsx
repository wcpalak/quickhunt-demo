import React, {Fragment, useEffect, useState} from 'react';
import SaidBarDesktop from "./SideBarDesktop";
import HeaderBar from "./HeaderBar";
import {Outlet, useLocation, useNavigate, useParams} from "react-router-dom";
import {TooltipProvider} from "@/components/ui/tooltip.jsx";
import {apiService, baseUrl, loadCrisp, logout} from "../../utils/constent";
import {userDetailsAction} from "../../redux/action/UserDetailAction";
import {useDispatch} from "react-redux";
import logoAnimation from "../../assets/logoanimation.gif";

const DefaultLayout = () => {
    const location = useLocation();
    const {id} = useParams();
    const dispatch = useDispatch();
    const [isMobile, setIsMobile] = useState(false);
    const [isPlanLoading, setIsPlanLoading] = useState(true);
    let navigate = useNavigate();

    useEffect(() => {
        loadCrisp();
    }, []);

    useEffect(() => {
        loginUserDetails();
    }, []);

    const loginUserDetails = async () => {
        const data = await apiService.getUserDetails();
        setIsPlanLoading(false);
        if (data.success) {
            const { firstName, lastName, email, id } = data?.data;
            dispatch(userDetailsAction({...data.data}));
            // window.quickhuntSettings = {
            //     name: `${firstName} ${lastName}`,
            //     email: email,
            // };
            // window.Quickhunt_In_App_Message_Config = window.Quickhunt_In_App_Message_Config || [];
            // window.Quickhunt_In_App_Message_Config = [
            //     { Quickhunt_In_App_Message_Key: "NGQ2Z1VMQUNjUW9rbGJrMjZMMFZIQT09Ojpqdjd2dGxMWWFpY28wR1ptSVVtdmNnPT0=" },
            //     { Quickhunt_In_App_Message_Key: "dytrQXZlT25JVW5DN2VkeWxZUXdhZz09OjptYkVYYjNjWFRObFUzanRhSXRRb3RnPT0=" },
            // ];
            // window.QuickhuntScriptLoad();
            if (window.$crisp) {
                try {
                    const userIdStr = id?.toString?.();
                    if (userIdStr) {
                        window.$crisp.push(["set", "user:nickname", [`${firstName} ${lastName}`]]);
                        window.$crisp.push(["set", "user:email", [email]]);
                        window.$crisp.push(["set", "session:data", [["userId", userIdStr]]]);
                    }
                } catch (e) {}
            }
            
        } else if(data?.error?.code === 404) {
            logout();
            navigate(`${baseUrl}/login`);
        }
    }

    return (
        <div className={"h-full"}>
            <div dir={"ltr"}>
                <HeaderBar setIsMobile={setIsMobile}/>
                {isPlanLoading ? "" : <SaidBarDesktop isMobile={isMobile} setIsMobile={setIsMobile} />}
                <Fragment>
                    <div className={`ltr:xl:ml-[250px] rtl:xl:mr-[250px]`}>
                        {/* <main className={`${location.pathname.includes(`/feedback/${id}`) ? "pb-3 md:pb-0" : ""}`}> */}
                        <main>
                            <div className={`bodyScreenHeight overflow-y-auto`}>
                                {isPlanLoading ?
                                    <div className={'absolute inset-0 z-10 m-auto flex justify-center items-center'}>
                                        <Fragment>
                                            <img src={logoAnimation} className={"w-[80px] min-w-[80px] bg-white rounded h-[80px]"} alt="logoAnimation"/>
                                        </Fragment>
                                    </div> :
                                    <TooltipProvider><Outlet/></TooltipProvider>
                                }
                            </div>
                        </main>
                    </div>
                </Fragment>
            </div>
        </div>
    );
};

export default DefaultLayout;
