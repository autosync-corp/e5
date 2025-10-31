import {createRouter, createWebHistory} from 'vue-router'
import type {RouteRecordRaw} from 'vue-router'
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

export default router
