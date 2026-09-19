import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import LoginPage from "./pages/LoginPage";
import ResellerInfoPage from "./pages/ResellerInfoPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminResellers from "./pages/admin/AdminResellers";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminApps from "./pages/admin/AdminApps";
import AdminAppDetail from "./pages/admin/AdminAppDetail";
import AdminKeys from "./pages/admin/AdminKeys";
import AdminApiKeys from "./pages/admin/AdminApiKeys";
import AdminResellerDetail from "./pages/admin/AdminResellerDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminIpWhitelist from "./pages/admin/AdminIpWhitelist";
import AdminSecurity from "./pages/admin/AdminSecurity";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminStock from "./pages/admin/AdminStock";
import AdminOtherStore from "./pages/admin/AdminOtherStore";
import AdminManualDelivery from "./pages/admin/AdminManualDelivery";
import AdminDownloads from "./pages/admin/AdminDownloads";
import AdminResellerInfo from "./pages/admin/AdminResellerInfo";
import AdminTransferKeys from "./pages/admin/AdminTransferKeys";
import AdminVgAuth from "./pages/admin/AdminVgAuth";
import AdminVgAuthApp from "./pages/admin/AdminVgAuthApp";
import ResellerLayout from "./pages/reseller/ResellerLayout";
import ResellerProfile from "./pages/reseller/ResellerProfile";
import ResellerApps from "./pages/reseller/ResellerApps";
import ResellerAppDetail from "./pages/reseller/ResellerAppDetail";
import ResellerKeys from "./pages/reseller/ResellerKeys";
import ResellerTickets from "./pages/reseller/ResellerTickets";
import ResellerStats from "./pages/reseller/ResellerStats";
import ResellerDashboard from "./pages/reseller/ResellerDashboard";
import SetupPage from "./pages/SetupPage";
import { LanguageWelcomeModal } from "./components/LanguageWelcomeModal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/resellerinfo" component={ResellerInfoPage} />
      <Route path="/setup" component={SetupPage} />

      {/* Admin routes */}
      <Route path="/admin">
        {() => (
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/resellers">
        {() => (
          <AdminLayout>
            <AdminResellers />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/categories">
        {() => (
          <AdminLayout>
            <AdminCategories />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/apps">
        {() => (
          <AdminLayout>
            <AdminApps />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/apps/:id">
        {(params) => (
          <AdminLayout>
            <AdminAppDetail id={parseInt(params.id)} />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/resellers/:id">
        {(params) => (
          <AdminLayout>
            <AdminResellerDetail id={parseInt(params.id)} />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/keys">
        {() => (
          <AdminLayout>
            <AdminKeys />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/transfer-keys">
        {() => (
          <AdminLayout>
            <AdminTransferKeys />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/api-keys">
        {() => (
          <AdminLayout>
            <AdminApiKeys />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/ip-whitelist">
        {() => (
          <AdminLayout>
            <AdminIpWhitelist />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/security">
        {() => (
          <AdminLayout>
            <AdminSecurity />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/tickets">
        {() => (
          <AdminLayout>
            <AdminTickets />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/applications">
        {() => (
          <AdminLayout>
            <AdminApplications />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/support">
        {() => (
          <AdminLayout>
            <AdminSupport />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/stock">
        {() => (
          <AdminLayout>
            <AdminStock />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/manual-delivery">
        {() => (
          <AdminLayout>
            <AdminManualDelivery />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/downloads">
        {() => (
          <AdminLayout>
            <AdminDownloads />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/other-store">
        {() => (
          <AdminLayout>
            <AdminOtherStore />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/reseller-info">
        {() => (
          <AdminLayout>
            <AdminResellerInfo />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/vg-auth">
        {() => (
          <AdminLayout>
            <AdminVgAuth />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/vg-auth/:id">
        {(params) => (
          <AdminLayout>
            <AdminVgAuthApp id={parseInt(params.id)} />
          </AdminLayout>
        )}
      </Route>

      {/* Reseller routes */}
      <Route path="/reseller">
        {() => (
          <ResellerLayout>
            <ResellerProfile />
          </ResellerLayout>
        )}
      </Route>
      <Route path="/reseller/apps">
        {() => (
          <ResellerLayout>
            <ResellerApps />
          </ResellerLayout>
        )}
      </Route>
      <Route path="/reseller/apps/:id">
        {(params) => (
          <ResellerLayout>
            <ResellerAppDetail id={parseInt(params.id)} />
          </ResellerLayout>
        )}
      </Route>
      <Route path="/reseller/keys">
        {() => (
          <ResellerLayout>
            <ResellerKeys />
          </ResellerLayout>
        )}
      </Route>
      <Route path="/reseller/tickets">
        {() => (
          <ResellerLayout>
            <ResellerTickets />
          </ResellerLayout>
        )}
      </Route>
      <Route path="/reseller/dashboard">
        {() => (
          <ResellerLayout>
            <ResellerDashboard />
          </ResellerLayout>
        )}
      </Route>
      <Route path="/reseller/stats">
        {() => (
          <ResellerLayout>
            <ResellerStats />
          </ResellerLayout>
        )}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster theme="dark" position="top-right" />
            <LanguageWelcomeModal />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
