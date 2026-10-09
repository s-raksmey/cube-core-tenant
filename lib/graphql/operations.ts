import { gql } from "@apollo/client";

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      role
      tenantId
      tenant {
        id
        name
        slug
        type
        status
      }
    }
  }
`;

export const TENANT_DASHBOARD_QUERY = gql`
  query TenantDashboard {
    tenantDashboard {
      tenant {
        id
        name
        slug
        status
      }
      totalUsers
      activeUsers
      publishedContent
      mediaStorageBytes
      contentActivityByMonth {
        month
        count
      }
      contentByStatus {
        status
        count
      }
      recentUsers {
        id
        email
        role
        status
        createdAt
      }
      recentActivity {
        id
        action
        createdAt
        actorEmail
      }
    }
  }
`;
