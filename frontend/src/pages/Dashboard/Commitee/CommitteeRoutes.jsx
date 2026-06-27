import { Route } from 'react-router-dom';
import CommitteeDashboard from './CommitteeDashboard';
import CommitteeFeedback from './CommitteeFeedback';
import CommitteeGradingSchedule from './CommitteeGradingSchedule';
import CommitteeEvaluations from './CommitteeEvaluations';
import CommitteeProjectArchives from './CommitteeProjectArchives';
import CommitteePublishedResults from './CommitteePublishedResults';
import CommitteeReports from './CommitteeReports';
import { COMMITTEE_PATHS } from './committeePaths';

const CommitteeRoleRoute = ({ children }) => children;

export const committeeRouteElements = (RoleRoute = CommitteeRoleRoute) => (
  <>
    <Route path={COMMITTEE_PATHS.feedback} element={<RoleRoute role="Committee"><CommitteeFeedback /></RoleRoute>} />
    <Route path={COMMITTEE_PATHS.gradingSchedule} element={<RoleRoute role="Committee"><CommitteeGradingSchedule /></RoleRoute>} />
    <Route path={COMMITTEE_PATHS.evaluations} element={<RoleRoute role="Committee"><CommitteeEvaluations /></RoleRoute>} />
    <Route path={COMMITTEE_PATHS.archives} element={<RoleRoute role="Committee"><CommitteeProjectArchives /></RoleRoute>} />
    <Route path={COMMITTEE_PATHS.publishedResults} element={<RoleRoute role="Committee"><CommitteePublishedResults /></RoleRoute>} />
  </>
);

export { CommitteeDashboard, CommitteeReports, COMMITTEE_PATHS };
