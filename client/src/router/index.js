import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/views/HomePage.vue";
import TicketForm from "@/components/TicketForm.vue";
import TicketList from "@/components/TicketList.vue";
import PrintTicket from "@/components/PrintTicket.vue";
import CustomerList from "@/components/CustomerList.vue";
import CustomerForm from "@/components/CustomerForm.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomePage,
  },
  {
    path: "/new",
    name: "new-ticket",
    component: TicketForm,
  },
  {
    path: "/edit/:id",
    name: "edit-ticket",
    component: TicketForm,
    props: true,
  },
  {
    path: "/list",
    name: "ticket-list",
    component: TicketList,
  },
  {
    path: "/print/:id",
    name: "print-ticket",
    component: PrintTicket,
    props: true,
  },
  {
    path: "/customers",
    name: "customer-list",
    component: CustomerList,
  },
  {
    path: "/customers/new",
    name: "new-customer",
    component: CustomerForm,
  },
  {
    path: "/customers/edit/:id",
    name: "edit-customer",
    component: CustomerForm,
    props: true,
  },

  // Catch-all route for 404
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/views/NotFound.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
