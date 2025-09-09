import axios from "axios";
import { logout, token, baseUrl } from "./constent";
import qs from "qs";

const baseUrlApi =
  import.meta.env.VITE_APP_TYPE === "local"
    ? import.meta.env.VITE_APP_API_URL_LOCAL
    : import.meta.env.VITE_APP_TYPE === "dev"
      ? import.meta.env.VITE_APP_API_URL_DEV
      : import.meta.env.VITE_APP_API_URL_PROD;

const instance = axios.create();

instance.interceptors.request.use(function (config) {
  if (config?.headers?.Authorization) {
    config.headers["Authorization"] = config?.headers?.Authorization;
  } else {
    config.headers["Authorization"] = `Bearer ${token() || ""}`;
  }
  return config;
});

export class ApiService {
  async fetchData(
    method,
    url,
    data,
    isFormData,
    header,
    responseType = "json"
  ) {
    const config = {
      headers: {
        ...(header || {}),
        "content-type": isFormData ? "multipart/form-data" : "application/json",
      },
      responseType,
    };
    let result = "";
    try {
      const res = await instance[method](url, data, config);
      if (res.status === 200) {
        if (responseType === "blob") {
          return res.data;
        }
        result = res.data;
      } else if (res?.status === 403) {
        logout();
        window.location.replace(`${baseUrl}/login`);
      } else {
        result = res?.data;
      }
    } catch (e) {
      if (e?.response?.status === 403) {
        logout();
        window.location.replace(`${baseUrl}/login`);
      } else {
        if (e.response?.data instanceof Blob) {
          const errorText = await e.response.data.text();
          try {
            result = JSON.parse(errorText);
          } catch {
            result = { success: false, message: errorText };
          }
        } else {
          result = e?.response?.data || { success: false };
        }
      }
    }
    return result;
  }

  //----------------------------API-Methods-----------------------------//
  async getData(url, header) {
    return await this.fetchData("get", url, null, false, header);
  }

  async postData(url, data, isFormData, header, responseType = "json") {
    return await this.fetchData(
      "post",
      url,
      data,
      isFormData,
      header,
      responseType
    );
  }

  async putData(url, data, isFormData, header) {
    return await this.fetchData("put", url, data, isFormData, header);
  }

  async deleteData(url, header) {
    return await this.fetchData("delete", url, null, false, header);
  }

  //---------------------------------------------------------------------//

  /* ---------- Auth Folder api and Settings Profile api ---------- */
  async adminSignup(payload) {
    return await this.postData(`${baseUrlApi}/auth/register`, payload);
  }

  async deleteAccount(payload) {
    return await this.postData(`${baseUrlApi}/auth/delete-account`, payload);
  }

  async enableAuth(payload) {
    return await this.postData(`${baseUrlApi}/auth/enable-2fa`, payload);
  }

  async disableAuth(payload) {
    return await this.postData(`${baseUrlApi}/auth/disable-2fa`, payload);
  }

  async verifyAuth(payload, token = {}) {
    return await this.postData(
      `${baseUrlApi}/auth/verify-2fa`,
      payload,
      false,
      token
    );
  }

  async connectGoogle(payload) {
    return await this.postData(`${baseUrlApi}/auth/connect-google`, payload);
  }

  async createPassword(payload) {
    return await this.postData(`${baseUrlApi}/auth/create-password`, payload);
  }

  async login(payload) {
    return await this.postData(`${baseUrlApi}/auth/login`, payload);
  }

  async getUserDetails(token = {}) {
    return await this.getData(`${baseUrlApi}/auth/user`, token);
  }

  async updateLoginUserDetails(payload) {
    return await this.putData(`${baseUrlApi}/auth/user/update`, payload, true);
  }

  async forgotPassword(payload) {
    return await this.postData(`${baseUrlApi}/auth/forgot-password`, payload);
  }

  async resetPassword(payload) {
    return await this.postData(`${baseUrlApi}/auth/reset-password`, payload);
  }

  async getInvitationDetail(token) {
    return await this.getData(
      `${baseUrlApi}/invited-users/detail?token=${token}`
    );
  }

  async acceptReject(payload) {
    return await this.postData(`${baseUrlApi}/invited-users/respond`, payload);
  }

  /* --------------------------------- On Boarding ----------------------------------- */
  async onBoardingFlow(payload, token = {}) {
    return await this.postData(
      `${baseUrlApi}/auth/onboard`,
      payload,
      false,
      token
    );
  }

  /* ---------- Announcement api ---------- */
  async getAllPosts(payload) {
    return await this.getData(`${baseUrlApi}/posts/?${qs.stringify(payload)}`);
  }

  async getSinglePosts(id) {
    return await this.getData(`${baseUrlApi}/posts/single?id=${id}`);
  }

  async createPosts(payload) {
    return await this.postData(`${baseUrlApi}/posts/`, payload, true);
  }

  async updatePosts(payload, id) {
    return await this.putData(`${baseUrlApi}/posts/?id=${id}`, payload, true);
  }

  async deletePosts(id) {
    return await this.deleteData(`${baseUrlApi}/posts/?id=${id}`);
  }

  async getFeedback(payload) {
    return await this.getData(
      `${baseUrlApi}/posts/feedback/?${qs.stringify(payload)}`
    );
  }

  async getReaction(payload) {
    return await this.getData(
      `${baseUrlApi}/posts/reactions/?${qs.stringify(payload)}`
    );
  }

  async announcementBatchUpdate(payload) {
    return await this.postData(`${baseUrlApi}/posts/bulk-update`, payload);
  }

  async changelogLimitCheck(payload) {
    return await this.postData(
      `${baseUrlApi}/posts/changelog-limit-check`,
      payload
    );
  }

  async updateAnnouncementStatus(payload, id) {
    return await this.putData(
      `${baseUrlApi}/posts/update-status/${id}`,
      payload
    );
  }

  /* ---------- Settings Labels api ---------- */
  async getAllLabels(id) {
    return await this.getData(`${baseUrlApi}/labels/?id=${id}`);
  }

  async createLabels(payload) {
    return await this.postData(`${baseUrlApi}/labels/`, payload);
  }

  async updateLabels(payload, id) {
    return await this.putData(`${baseUrlApi}/labels/?id=${id}`, payload);
  }

  async deleteLabels(id) {
    return await this.deleteData(`${baseUrlApi}/labels?id=${id}`);
  }

  async labelBatchUpdate(payload) {
    return await this.postData(`${baseUrlApi}/labels/bulk-delete`, payload);
  }

  /* ---------- Settings Project api ---------- */
  async getAllProjects() {
    return await this.getData(`${baseUrlApi}/projects/`);
  }

  async getSingleProjects(id) {
    return await this.getData(`${baseUrlApi}/projects/single?id=${id}`);
  }

  async createProjects(payload, token = {}, isFormData = false) {
    return await this.postData(
      `${baseUrlApi}/projects/`,
      payload,
      isFormData,
      token
    );
  }

  async updateProjects(payload, id) {
    return await this.putData(
      `${baseUrlApi}/projects/?id=${id}`,
      payload,
      true
    );
  }

  async deleteProjects(id) {
    return await this.deleteData(`${baseUrlApi}/projects/?id=${id}`);
  }

  async multiDeleteProjects(payload) {
    return await this.postData(
      `${baseUrlApi}/projects/delete-selected-projects`,
      payload
    );
  }

  /* ---------- Inbox api ---------- */
  async inboxNotification(payload) {
    return await this.postData(`${baseUrlApi}/projects/notifications`, payload);
  }

  async inboxMarkAllRead(payload) {
    return await this.postData(
      `${baseUrlApi}/projects/notifications/mark-read`,
      payload
    );
  }

  /* ---------- Track Activity ---------- */

  async trackActivity(payload) {
    return await this.postData(
      `${baseUrlApi}/activity/track-activity`,
      payload
    );
  }
  /* ---------- Users api ---------- */
  async getAllUsers(payload) {
    return await this.getData(
      `${baseUrlApi}/customers/?${qs.stringify(payload)}`
    );
  }

  async createUsers(payload) {
    return await this.postData(`${baseUrlApi}/customers/store`, payload);
  }

  async userBatchUpdate(payload) {
    return await this.postData(`${baseUrlApi}/customers/bulk-delete`, payload);
  }

  async userManualUpVote(payload) {
    return await this.postData(`${baseUrlApi}/customers/vote`, payload);
  }

  async userAction(payload) {
    return await this.postData(`${baseUrlApi}/customers/actions`, payload);
  }

  async deleteUsers(id) {
    return await this.deleteData(`${baseUrlApi}/customers/delete/${id}`);
  }

  /* ---------- Roadmap api ---------- */
  async getRoadmapIdea(payload) {
    return await this.postData(
      `${baseUrlApi}/roadmap-statuses/with-ideas`,
      payload
    );
  }

  /* ---------- Settings Status api ---------- */

  async createSettingsStatus(payload) {
    return await this.postData(`${baseUrlApi}/roadmap-statuses/`, payload);
  }

  async updateSettingsStatus(payload, id) {
    return await this.putData(
      `${baseUrlApi}/roadmap-statuses/?id=${id}`,
      payload
    );
  }

  async onDeleteSettingsStatus(id) {
    return await this.deleteData(`${baseUrlApi}/roadmap-statuses/?id=${id}`);
  }

  async roadmapSettingsStatusRank(payload) {
    return await this.putData(`${baseUrlApi}/roadmap-statuses/rank`, payload);
  }

  async statusBatchUpdate(payload) {
    return await this.postData(
      `${baseUrlApi}/roadmap-statuses/bulk-delete`,
      payload
    );
  }

  /* ---------- Feedback api ---------- */
  async getAllIdea(payload) {
    return await this.postData(`${baseUrlApi}/ideas/getAll`, payload);
  }

  async ideaBulkUpdate(payload) {
    return await this.postData(`${baseUrlApi}/ideas/bulk-update`, payload);
  }

  async getDuplicateIdeas(payload) {
    return await this.getData(
      `${baseUrlApi}/ideas/duplicates?${qs.stringify(payload)}`
    );
  }

  async getIdeaVote(payload) {
    return await this.postData(`${baseUrlApi}/ideas/votes/`, payload);
  }

  async removeUserVote(payload) {
    return await this.postData(`${baseUrlApi}/ideas/votes/remove`, payload);
  }

  async getSingleIdea(id) {
    return await this.getData(`${baseUrlApi}/ideas/single/${id}`);
  }

  async getIdeaComments(payload) {
    return await this.getData(
      `${baseUrlApi}/ideas/comments?${qs.stringify(payload)}`
    );
  }

  async mergeIdeas(payload) {
    return await this.postData(`${baseUrlApi}/ideas/merge`, payload);
  }

  async unmergeIdeas(payload) {
    return await this.postData(`${baseUrlApi}/ideas/unmerge`, payload);
  }

  /* ---------- Common Roadmap api and Feedback common api and Settings Statuses api ---------- */
  async giveVote(payload) {
    return await this.postData(`${baseUrlApi}/ideas/votes/vote`, payload);
  }

  async updateIdea(payload, id) {
    return await this.putData(
      `${baseUrlApi}/ideas/update/${id}`,
      payload,
      true
    );
  }

  async onDeleteIdea(id) {
    return await this.deleteData(`${baseUrlApi}/ideas/delete/${id}`);
  }

  async setRoadmapRank(payload) {
    return await this.postData(`${baseUrlApi}/ideas/rank`, payload);
  }

  async createIdea(payload) {
    return await this.postData(`${baseUrlApi}/ideas/`, payload, true);
  }

  async createRoadmap(payload) {
    return await this.postData(`${baseUrlApi}/road-map/`, payload);
  }

  async getRoadmapoptions(id) {
    return await this.getData(`${baseUrlApi}/road-map/?projectId=${id}`);
  }

  async onDeleteRoadmap(id) {
    return await this.deleteData(`${baseUrlApi}/road-map/delete/${id}`);
  }

  async updateRoadmap(payload) {
    return await this.putData(`${baseUrlApi}/road-map/`, payload);
  }

  async createComment(payload) {
    return await this.postData(`${baseUrlApi}/ideas/comments/`, payload, true);
  }

  async updateComment(id, payload) {
    return await this.putData(
      `${baseUrlApi}/ideas/comments/update/${id}`,
      payload,
      true
    );
  }

  async deleteComment(id) {
    return await this.deleteData(`${baseUrlApi}/ideas/comments/delete/${id}`);
  }

  /* ---------- Dashboard api ---------- */
  async dashboardData(payload) {
    return await this.postData(`${baseUrlApi}/projects/dashboard`, payload);
  }

  async dashboardDataFeed(payload) {
    return await this.postData(`${baseUrlApi}/projects/feedbacks`, payload);
  }

  async dashboardDataReactions(payload) {
    return await this.postData(`${baseUrlApi}/projects/reactions`, payload);
  }

  /* ---------- In App Message api ---------- */
  async getAllInAppMessage(payload) {
    return await this.getData(`${baseUrlApi}/inapp/?${qs.stringify(payload)}`);
  }

  async createInAppMessage(payload) {
    return await this.postData(`${baseUrlApi}/inapp/`, payload);
  }

  async deleteInAppMessage(id) {
    return await this.deleteData(`${baseUrlApi}/inapp/delete/${id}`);
  }

  async getSingleInAppMessage(id, payload = {}) {
    return await this.getData(
      `${baseUrlApi}/inapp/single/${id}?${qs.stringify(payload)}`
    );
  }

  async getResponseInAppMessage(payload) {
    return await this.postData(`${baseUrlApi}/inapp/responses/report`, payload);
  }

  async updateInAppMessage(payload, id) {
    return await this.putData(`${baseUrlApi}/inapp/update/${id}`, payload);
  }

  async updateInAppMessageStatus(payload, id) {
    return await this.putData(`${baseUrlApi}/inapp/status/${id}`, payload);
  }

  async inAppMessBatchUpdate(payload) {
    return await this.postData(`${baseUrlApi}/inapp/bulk-update`, payload);
  }

  /* ---------- Help Center Category api ans Settings Categories api ---------- */
  async createCategory(payload) {
    return await this.postData(
      `${baseUrlApi}/article-categories/`,
      payload,
      true
    );
  }

  async createSubCategory(payload) {
    return await this.postData(
      `${baseUrlApi}/article-subcategories/`,
      payload,
      true
    );
  }

  async getAllCategory(payload) {
    return await this.getData(
      `${baseUrlApi}/article-categories/?${qs.stringify(payload)}`
    );
  }

  async getAllCategoryV2(payload) {
    return await this.getData(
      `${baseUrlApi}/article-categories/v2/?${qs.stringify(payload)}`
    );
  }

  async articleCategoryBatchUpdate(payload) {
    return await this.postData(
      `${baseUrlApi}/article-categories/bulk-delete`,
      payload
    );
  }

  async articleSubCategoryBatchUpdate(payload) {
    return await this.postData(
      `${baseUrlApi}/article-subcategories/bulk-delete`,
      payload
    );
  }

  async getAllSubCategory(id) {
    return await this.getData(`${baseUrlApi}/article-subcategories/?id=${id}`);
  }

  async updateCategory(payload, id) {
    return await this.putData(
      `${baseUrlApi}/article-categories/?id=${id}`,
      payload,
      true
    );
  }

  async updateSubCategory(payload, id) {
    return await this.putData(
      `${baseUrlApi}/article-subcategories/?id=${id}`,
      payload,
      true
    );
  }

  async deleteCategories(id) {
    return await this.deleteData(`${baseUrlApi}/article-categories/?id=${id}`);
  }

  async deleteSubCategories(id) {
    return await this.deleteData(
      `${baseUrlApi}/article-subcategories/?id=${id}`
    );
  }

  /* ---------- Help Center Articles api ---------- */
  async getAllArticles(payload) {
    return await this.getData(
      `${baseUrlApi}/articles/?${qs.stringify(payload)}`
    );
  }

  async createArticles(payload) {
    return await this.postData(`${baseUrlApi}/articles/`, payload);
  }

  async getSingleArticle(id) {
    return await this.getData(`${baseUrlApi}/articles/single?slug=${id}`);
  }

  async updateArticle(payload, id) {
    return await this.putData(`${baseUrlApi}/articles?id=${id}`, payload);
  }

  async deleteArticles(id) {
    return await this.deleteData(`${baseUrlApi}/articles/?id=${id}`);
  }

  async articlesBatchUpdate(payload) {
    return await this.postData(`${baseUrlApi}/articles/bulk-update`, payload);
  }

  async articleMediaDelete(payload) {
    return await this.postData(`${baseUrlApi}/media/`, payload);
  }

  /* ---------- Widget api ---------- */
  async getWidgets(id) {
    return await this.getData(`${baseUrlApi}/widgets/single/${id}`);
  }

  async getAllRoadmap(id) {
    return await this.getData(`${baseUrlApi}/v1/roadmaps?projectId=${id}`);
  }

  async UpdateRoadmap(payload) {
    return await this.postData(`${baseUrlApi}/v1/roadmap/ideas`, payload);
  }

  async updateWidgets(payload, id) {
    return await this.putData(`${baseUrlApi}/widgets/update/${id}`, payload);
  }

  async createWidgets(payload) {
    return await this.postData(`${baseUrlApi}/widgets/`, payload);
  }

  async onDeleteWidget(id) {
    return await this.deleteData(`${baseUrlApi}/widgets/delete/${id}`);
  }

  async widgetBatchUpdate(payload) {
    return await this.postData(`${baseUrlApi}/widgets/bulk-delete`, payload);
  }

  async getWidgetsSetting(payload) {
    return await this.getData(
      `${baseUrlApi}/widgets/?${qs.stringify(payload)}`
    );
  }

  /* ---------- Settings Board api ---------- */
  async createCategorySettings(payload) {
    return await this.postData(`${baseUrlApi}/categories/`, payload);
  }

  async categoryBatchUpdate(payload) {
    return await this.postData(`${baseUrlApi}/categories/bulk-delete`, payload);
  }

  async deleteCategorySettings(id) {
    return await this.deleteData(`${baseUrlApi}/categories/?id=${id}`);
  }

  async updateCategorySettings(payload, id) {
    return await this.putData(`${baseUrlApi}/categories/?id=${id}`, payload);
  }

  /* ---------- Settings Board api ---------- */
  async getAllBoards(id) {
    return await this.getData(`${baseUrlApi}/board/?id=${id}`);
  }

  async boardBatchUpdate(payload) {
    return await this.postData(`${baseUrlApi}/board/bulk-delete`, payload);
  }

  async createBoard(payload) {
    return await this.postData(`${baseUrlApi}/board/`, payload);
  }

  async deleteBoard(id) {
    return await this.deleteData(`${baseUrlApi}/board/?id=${id}`);
  }

  async updateBoard(payload, id) {
    return await this.putData(`${baseUrlApi}/board/?id=${id}`, payload);
  }

  /* ---------- Settings Domain api and GeneralSettings api ---------- */
  async getPortalSetting(id) {
    return await this.getData(`${baseUrlApi}/settings/?id=${id}`);
  }

  async updatePortalSetting(id, payload) {
    return await this.putData(`${baseUrlApi}/settings/?id=${id}`, payload);
  }

  /* ---------- Settings Emoji api ---------- */
  async createEmoji(payload) {
    return await this.postData(`${baseUrlApi}/emojis/`, payload);
  }

  async emojiBatchUpdate(payload) {
    return await this.postData(`${baseUrlApi}/emojis/bulk-delete`, payload);
  }

  async getAllEmoji(id) {
    return await this.getData(`${baseUrlApi}/emojis/?id=${id}`);
  }

  async deleteEmoji(id) {
    return await this.deleteData(`${baseUrlApi}/emojis/?id=${id}`);
  }

  async updateEmoji(payload, id) {
    return await this.putData(`${baseUrlApi}/emojis/?id=${id}`, payload);
  }

  /* ---------- Settings Social api ---------- */
  async updateSocialSetting(payload) {
    return await this.postData(`${baseUrlApi}/social/`, payload);
  }

  /* ---------- Settings Tags api ---------- */
  async createTopics(payload) {
    return await this.postData(`${baseUrlApi}/tags/`, payload);
  }

  async tagsBatchUpdate(payload) {
    return await this.postData(`${baseUrlApi}/tags/bulk-delete`, payload);
  }

  async updateTopics(payload, id) {
    return await this.putData(`${baseUrlApi}/tags/?id=${id}`, payload);
  }

  async deleteTopics(id) {
    return await this.deleteData(`${baseUrlApi}/tags/?id=${id}`);
  }

  /* ---------- Settings Team api ---------- */
  async getAllMember(id) {
    return await this.getData(`${baseUrlApi}/teams/?id=${id}`);
  }

  async getInvitation(id) {
    return await this.getData(`${baseUrlApi}/invited-users/?id=${id}`);
  }

  async inviteUser(payload) {
    return await this.postData(`${baseUrlApi}/invited-users/invite`, payload);
  }

  async removeMember(id) {
    return await this.deleteData(`${baseUrlApi}/teams/member?id=${id}`);
  }

  /* ---------- Import Export api ---------- */
  async ideaImport(payload) {
    return await this.postData(`${baseUrlApi}/ideas/import`, payload);
  }

  /* ---------- HeaderBar Api ---------- */
  async getAllStatusAndTypes(id) {
    return await this.getData(`${baseUrlApi}/projects/all-detail?id=${id}`);
  }

  /* ---------- Pricing Plan Api ---------- */
  async changePlan(payload) {
    return await this.postData(`${baseUrlApi}/plans/change`, payload);
  }
  /* ---------- Subscription Plan Api ---------- */
  async planSubscription() {
    return await this.getData(`${baseUrlApi}/plans/manage-subscription`);
  }

  /* ---------- Other Api ---------- */

  async getIntegrations(projectId) {
    return await this.getData(
      `${baseUrlApi}/integrations/by-project?id=${projectId}`
    );
  }

  async connectIntegration(payload) {
    return await this.postData(`${baseUrlApi}/integrations/`, payload);
  }

  async disconnectIntegration(integrationId) {
    return await this.deleteData(
      `${baseUrlApi}/integrations/disconnect?id=${integrationId}`
    );
  }

  async getAllIntegrations(projectId) {
    return await this.getData(
      `${baseUrlApi}/integrations/?projectId=${projectId}`
    );
  }

  // slack
  async getSlackIntegration(payload) {
    return await this.postData(`${baseUrlApi}/slack/oauth/authorize`, payload);
  }

  //jira
  async getJiraIntegration(payload) {
    return await this.postData(`${baseUrlApi}/jira/statuses`, payload);
  }

  async getJiraProjects(payload) {
    return await this.postData(`${baseUrlApi}/jira/projects`, payload);
  }

  async getJiraProjectIssues(payload) {
    return await this.postData(`${baseUrlApi}/jira/projects/issues`, payload);
  }

  async createJiraIssue(payload) {
    return await this.postData(`${baseUrlApi}/jira/issues/create`, payload);
  }

  async searchJiraIssues(payload) {
    return await this.postData(`${baseUrlApi}/jira/issues`, payload);
  }

  async linkJiraIssue(payload) {
    return await this.postData(`${baseUrlApi}/jira/issues/link`, payload);
  }

  async unlinkJiraIssue(payload) {
    return await this.postData(`${baseUrlApi}/jira/issues/unlink`, payload);
  }

  async getAllSlackWorkspace(projectId) {
    return await this.getData(
      `${baseUrlApi}/slack/teams?projectId=${projectId}`
    );
  }

  async isExistSlack(projectId) {
    return await this.getData(
      `${baseUrlApi}/slack/teams/check?projectId=${projectId}`
    );
  }

  async getAllSlackChannels(payload) {
    return await this.getData(
      `${baseUrlApi}/slack/teams/channels?${qs.stringify(payload)}`
    );
  }

  async workSpaceDisconnectOnSlack(payload) {
    return await this.deleteData(
      `${baseUrlApi}/slack/teams/disconnect?${qs.stringify(payload)}`
    );
  }

  // github
  async getGitHubAllRepo(payload) {
    return await this.postData(`${baseUrlApi}/github/repos`, payload);
  }

  async gitHubCreateIssue(payload) {
    return await this.postData(`${baseUrlApi}/github/issues/create`, payload);
  }

  async gitHubCreateLinkIssue(payload) {
    return await this.postData(`${baseUrlApi}/github/issues/link`, payload);
  }

  async getGitHubLinkedIssue(payload) {
    return await this.postData(`${baseUrlApi}/github/issues`, payload);
  }

  async gitHubDeleteIssue(payload) {
    return await this.deleteData(
      `${baseUrlApi}/github/issues/unlink?${qs.stringify(payload)}`
    );
  }

  // zapier
  async acceptZapier(payload) {
    return await this.postData(`${baseUrlApi}/zapier/authorize`, payload);
  }

  // hubspot
  async getHubSpot(payload) {
    return await this.postData(
      `${baseUrlApi}/hubspot/oauth/authorize`,
      payload
    );
  }

  async getHubSpotStatuses(payload) {
    return await this.getData(
      `${baseUrlApi}/hubspot/statuses?${qs.stringify(payload)}`
    );
  }

  async createUpdateHubSpotRules(payload) {
    return await this.postData(`${baseUrlApi}/integrations/rules/`, payload);
  }

  async getHubSpotRules(payload) {
    return await this.getData(
      `${baseUrlApi}/integrations/rules/?${qs.stringify(payload)}`
    );
  }

  async hubSpotDeleteRule(payload) {
    return await this.deleteData(
      `${baseUrlApi}/integrations/rules/?${qs.stringify(payload)}`
    );
  }

  async createHubSpotTicket(payload) {
    return await this.postData(`${baseUrlApi}/hubspot/tickets`, payload);
  }

  async getHubSpotTicketsForLink(payload) {
    return await this.getData(
      `${baseUrlApi}/hubspot/tickets?${qs.stringify(payload)}`
    );
  }

  async hubSpotLinkTicket(payload) {
    return await this.postData(`${baseUrlApi}/hubspot/tickets/link`, payload);
  }

  async hubSpotRemoveTicket(payload) {
    return await this.deleteData(
      `${baseUrlApi}/hubspot/tickets/remove?${qs.stringify(payload)}`
    );
  }

  // track
  async getTopDevices(payload) {
    return await this.getData(
      `${baseUrlApi}/visit/top-devices?${qs.stringify(payload)}`
    );
  }

  async getTopBrowsers(payload) {
    return await this.getData(
      `${baseUrlApi}/visit/top-browsers?${qs.stringify(payload)}`
    );
  }

  async getTopPages(payload) {
    return await this.getData(
      `${baseUrlApi}/visit/top-pages?${qs.stringify(payload)}`
    );
  }

  async getTopLocations(payload) {
    return await this.getData(
      `${baseUrlApi}/visit/top-locations?${qs.stringify(payload)}`
    );
  }

  async getTopSources(payload) {
    return await this.getData(
      `${baseUrlApi}/visit/top-sources?${qs.stringify(payload)}`
    );
  }

  async getWidgetAnalytics(payload) {
    return await this.getData(
      `${baseUrlApi}/widgets/analytics?${qs.stringify(payload)}`
    );
  }

  async getAnnouncementAnalytics(payload) {
    return await this.getData(
      `${baseUrlApi}/posts/analytics?${qs.stringify(payload)}`
    );
  }

  // global search
  async getGlobalSearchData(payload) {
    return await this.postData(`${baseUrlApi}/v1/multi-search`, payload);
  }

  async getCategorySubCategory(payload) {
    return await this.postData(
      `${baseUrlApi}/v1/categories/with-subcategories`,
      payload
    );
  }

  async getallSubCategory(id) {
    return await this.getData(`${baseUrlApi}/v1/categories?slug=${id}`);
  }

  async getArticleSingle(id) {
    return await this.getData(`${baseUrlApi}/articles/single?slug=${id}`);
  }

  async getallSubCategoryArticleList(id) {
    return await this.getData(`${baseUrlApi}/v1/subcategories?slug=${id}`);
  }

  async mediaDeleteImage(payload) {
    return await this.postData(`${baseUrlApi}/media/`, payload);
  }

  async getArticleAnalytics(payload) {
    return await this.getData(
      `${baseUrlApi}/articles/get-article-analytics?${qs.stringify(payload)}`
    );
  }

  async inviteduserSkipOnboard(payload) {
    return await this.postData(
      `${baseUrlApi}/invited-users/skip-onboarding`,
      payload
    );
  }

  async inAppmessageCondition(payload) {
    return await this.postData(
      `${baseUrlApi}/inapp/conditions/groups`,
      payload
    );
  }

  async updatePositionCategory(payload) {
    return await this.putData(
      `${baseUrlApi}/article-categories/update-positions`,
      payload
    );
  }

  async updatePositionSubCategory(payload) {
    return await this.putData(
      `${baseUrlApi}/article-subCategories/update-positions`,
      payload
    );
  }

  async updatePositionArticles(payload) {
    return await this.putData(
      `${baseUrlApi}/articles/update-positions`,
      payload
    );
  }

  // Get similar ideas for autocomplete
  async getSimilarIdeas(payload) {
    return await this.postData(`${baseUrlApi}/ideas/similar`, payload);
  }

  async updateUserTourStep(payload) {
    return await this.postData(`${baseUrlApi}/auth/updateSteps`, payload);
  }

  async createPostWithAi(payload) {
    return await this.postData(`${baseUrlApi}/posts/create-with-ai`, payload);
  }

  async generateSummaryWithAi(payload) {
    return await this.postData( `${baseUrlApi}/ideas/summarize-comments`, payload);
  }
}
