import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import { routes as galleryRoutes} from '@/gallery/router'
import { routes as coreRoutes} from '@/core/router'
import { routes as wheelsRoutes} from '@/wheels/router'
import {EMPTY_STRING} from "@/core/constants/App.ts";

const routes: Array<RouteRecordRaw> = [
    ...coreRoutes,
    ...galleryRoutes,
    ...wheelsRoutes,
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(() => {
    const viewEl = document.getElementById('router-view');
    if (viewEl) {
        window.scrollTo(0, 0);
        viewEl.innerHTML = EMPTY_STRING;
    }
});

export default router
