import React, { useEffect } from 'react';
import 'quill/dist/quill.snow.css'
import { ThemeProvider } from "./components/theme-provider";
import DefaultLayout from "./components/DefaultLayout/DefaultLayout";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoutes from "./components/Auth/ProtectedRoutes";
import { routes } from "./utils/routes";
import { baseUrl, initMixpanel, preserveSearchParams } from "./utils/constent";
import PublicRoutes from "./components/Auth/PublicRoutes";
import Register from "./components/Auth/Register";
import Login from "./components/Auth/Login";
import Forgot from "./components/Auth/Forgot";
import ResetPassword from "./components/Auth/ResetPassword";
import Invitation from "./components/Auth/Invitation";
import OnBoarding from "./components/Auth/OnBoarding/OnBoarding";
import PageNotFound from "./components/Auth/PageNotFound";
import ZapierAuthorize from "./components/Integrations/SubComponents/ZapierAuthorize";
import Verify2A from "@/components/Auth/Verify2A.jsx";
import { Toaster } from './components/ui/toaster';
import { TourProvider } from './components/Comman/TourProvider';
import TourWrapper from './components/Comman/TourWrapper';
import { ImagePreviewProvider } from './components/Comman/ImagePreviewProvider';

function App() {

    useEffect(() => {
        initMixpanel();
      }, []);

    return (
        <>
        <TourProvider>
        <ImagePreviewProvider>
            <BrowserRouter>
                <Toaster />
                <TourWrapper />
                <Routes>
                    <Route element={
                        <ThemeProvider >
                            <ProtectedRoutes />
                        </ThemeProvider>
                    }>
                        <Route exact path={`${baseUrl}/`} element={<DefaultLayout />}>
                            {
                                (routes || []).map((x, i) => {
                                    return <Route key={i} path={x.path} element={x.component} />
                                })
                            }
                            <Route path={`${baseUrl}/`} element={<Navigate to={preserveSearchParams(`${baseUrl}/dashboard`)} replace />} />
                        </Route>
                        <Route path={`${baseUrl}/authorize`} element={<ZapierAuthorize />} />
                    </Route>
                    <Route element={<ThemeProvider><PublicRoutes /></ThemeProvider>}>
                        <Route path={`${baseUrl}/register`} element={<Register />} />
                        <Route path={`${baseUrl}/login`} element={<Login />} />
                        <Route path={`${baseUrl}/verify-2fa`} element={<Verify2A />} />
                        <Route path={`${baseUrl}/forgot-password`} element={<Forgot />} />
                        <Route path={`${baseUrl}/reset-verify`} element={<ResetPassword />} />
                        <Route path={`${baseUrl}/onboarding`} element={<OnBoarding />} />
                    </Route>
                    <Route path={`${baseUrl}/invitation`} element={<Invitation />} />
                    <Route path="*" element={<PageNotFound />} />
                </Routes>
            </BrowserRouter>
            </ImagePreviewProvider>
            </TourProvider>
        </>
    )
}

export default App
