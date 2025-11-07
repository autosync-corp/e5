import {createRouter, createWebHistory, type RouteRecordRaw, type RouteLocationNormalized} from 'vue-router'
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

router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    if (to.name !== from.name) {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth",
        });
    }
});

export default router
