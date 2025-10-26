export const routes = [
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        redirect: '/'
    },
    {
        path: '/',
        name: 'home',
        component: () => import("@/core/views/HomePage.vue"),
    },
];