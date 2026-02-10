import {useEffect, useState} from "react";
import {Route, Routes, useNavigate} from "react-router-dom";
import {useAppDispatch} from "./app/hooks";
import {loading, notLoading} from "./features/loading/loadingSlice";
import {fetchWithResponse} from "./utils/EasyFetch";
import {GetViewsResponse} from "./utils/views/GetViewsResponse";
import {SimpleView} from "./utils/views/SimpleView";
import {ViewsList} from "./components/views-list";
import {Loading} from "./components/Loading";
import {ViewDetail} from "./components/view-detail";

export default function App() {
    const [views, setViews] = useState<SimpleView[]>([]);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchViews = async () => {
            dispatch(loading());

            try {
                const response = await fetchWithResponse<GetViewsResponse>(
                    "GET",
                    "/views?game=wow&featured=true",
                    undefined,
                    `Bearer ${process.env.REACT_APP_SERVICE_TOKEN}`
                );

                setViews(response.records);
            } catch (error) {
                console.error("Failed to fetch views", error);
            } finally {
                dispatch(notLoading());
            }
        };

        fetchViews();
    }, [dispatch]);

    const handleViewClick = (viewId: string) => {
        navigate(`/views/${viewId}`);
    };

    return (
        <>
            <Loading/>

            <Routes>
                <Route
                    path="/"
                    element={
                        <ViewsList
                            views={views}
                            onViewClick={handleViewClick}
                        />
                    }
                />
                <Route path="/views/:viewId" element={<ViewDetail/>}/>
            </Routes>
        </>
    );
}
