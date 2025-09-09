import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from 'react-redux';
import { baseUrl, isTokenAboutToExpire, logout, getTokenVerify, token, preserveSearchParams } from "../../utils/constent";

const ProtectedRoutes = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isValidToken, setIsValidToken] = useState(false);
    const userDetailsReducer = useSelector(state => state.userDetailsReducer);
    const projectDetailsReducer = useSelector(state => state.projectDetailsReducer);
    const location = useLocation();

    useEffect(() => {
        const checkToken = async () => {
            const currentToken = token();
            if (!currentToken || isTokenAboutToExpire()) {
                document.querySelectorAll(".quickhunt").forEach((x) => {
                    x.innerHTML = "";
                });
                logout();
                setIsValidToken(false);
            } else {
                setIsValidToken(true);
            }
            setIsLoading(false);
        };
        checkToken();
    }, []);

    if (isLoading) return null;

    if ((isValidToken || getTokenVerify()) &&
        projectDetailsReducer?.userId === userDetailsReducer?.id &&
        userDetailsReducer?.stripeStatus === null &&
        location.pathname !== `${baseUrl}/pricing`) {
        return <Navigate to={`${baseUrl}/pricing`} replace />;
    }

    return (isValidToken || getTokenVerify()) ? (
        <Outlet />
    ) : (
        <Navigate to={preserveSearchParams(`${baseUrl}/login`, location.search)} />
    );
};

export default ProtectedRoutes;
