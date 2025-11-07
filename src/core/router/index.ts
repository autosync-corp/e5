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
    {
        path: '/pending',
        name: 'pending',
        component: () => import("@/core/views/PendingPage.vue"),
    },
];