import {Fragment} from 'react';
import {useNavigate} from "react-router-dom";
import {Button} from "../ui/button";
import {baseUrl, token} from "../../utils/constent";

const PageNotFound = () => {
    const navigate = useNavigate();
    return (
        <Fragment>
            <div className="p-5 min-h-screen flex justify-center items-center flex-col bg-blue-50">
                <h1 className="pnf-404 md:text-9xl text-8xl text-primary">404</h1>
                <p className="py-6 font-semibold text-xl text-center text-gray-700">Ooops!!! The page you are looking
                    for is not found</p>
                <Button onClick={() => navigate(`${baseUrl}/${token() ? 'dashboard' : 'login'}`)}>Back
                    to {token() ? 'Dashboard' : 'Login'}</Button>
            </div>
        </Fragment>
    );
};

export default PageNotFound;