import {useEffect, useState} from 'react';
import {ViewsList} from "@/app/components/views-list";
import {CreateViewDialog} from "@/app/components/create-view-dialog";
import {useAppDispatch} from "./hooks";
import {SimpleView} from "@/app/utils/views/SimpleView";
import {loading, notLoading} from "./features/loading/loadingSlice";
import {fetchWithResponse} from "./utils/EasyFetch";
import {GetViewsResponse} from "./utils/views/GetViewsResponse";
import {ViewDetail} from "@/app/components/view-detail";
import {RaiderioProfile} from "@/app/utils/raiderio";


type Screen =
    | { type: 'views' }
    | { type: 'view-detail'; viewId: string }
    | { type: 'character-detail'; character: RaiderioProfile; viewId: string };

export default function App() {
    const [views, setViews] = useState<SimpleView[]>([]);
    const [currentScreen, setCurrentScreen] = useState<Screen>({type: 'views'});
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const dispatch = useAppDispatch();

    useEffect(() => {
        const fetchViews = async () => {
            dispatch(loading());
            try {
                const response = await fetchWithResponse<GetViewsResponse>(
                    "GET",
                    "/views?game=wow&featured=true",
                    undefined,
                    `Bearer ${import.meta.env.VITE_SERVICE_TOKEN}`
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

    const handleCreateView = (name: string, description: string) => {
        const newView: SimpleView = null;
        setViews([...views, newView]);
    };

    const handleViewClick = (viewId: string) => {
        setCurrentScreen({type: 'view-detail', viewId});
    };

    const handleCharacterClick = (character: RaiderioProfile, viewId: string) => {
        setCurrentScreen({type: 'character-detail', character, viewId});
    };

    const handleBackToViews = () => {
        setCurrentScreen({type: 'views'});
    };

    const handleBackToView = (viewId: string) => {
        setCurrentScreen({type: 'view-detail', viewId});
    };

    // Render based on current screen
    if (currentScreen.type === 'views') {
        return (
            <>
                <ViewsList
                    views={views}
                    onViewClick={handleViewClick}
                    onCreateView={() => setIsCreateDialogOpen(true)}
                />
                <CreateViewDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    onCreateView={handleCreateView}
                />
            </>
        );
    }

    if (currentScreen.type === 'view-detail') {
        const view = views.find(v => v.id === currentScreen.viewId);
        if (!view) {
            setCurrentScreen({type: 'views'});
            return null;
        }

        return (
            <ViewDetail
                view={view}
                onBack={handleBackToViews}
            />
        );
    }
}