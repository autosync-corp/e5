import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import { routes as galleryRoutes} from '@/gallery/router'
import { routes as coreRoutes} from '@/core/router'
import { routes as wheelsRoutes} from '@/wheels/router'

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
    const viewEl = document.getElementById('#router-view');
    if (viewEl) {
        viewEl.style.height = '0';
        viewEl.innerHTML = '';
    }
});

router.afterEach(() => {
    const viewEl = document.getElementById('#router-view');
    if (viewEl) {
        viewEl.style.height = 'auto';
    }
});

export default router
