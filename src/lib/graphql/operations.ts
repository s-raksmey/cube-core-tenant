import { gql } from "@apollo/client";

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      username
      fullName
      firstName
      lastName
      type
      role
      status
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
        username
        fullName
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

export const TENANT_USERS_QUERY = gql`
  query TenantUsers($search: String, $page: Int, $pageSize: Int) {
    tenantUsers(search: $search, page: $page, pageSize: $pageSize) {
      items {
        id
        email
        username
        firstName
        lastName
        fullName
        role
        status
        createdAt
        lastLoginAt
        totpEnabled
      }
      total
      page
      pageSize
    }
  }
`;

export const CREATE_TENANT_USER = gql`
  mutation CreateTenantUser(
    $email: String!
    $firstName: String!
    $lastName: String!
    $role: SubTenantRole = ADMIN
  ) {
    createAdminUser(
      email: $email
      firstName: $firstName
      lastName: $lastName
      role: $role
    ) {
      user {
        id
        email
        firstName
        lastName
        fullName
        role
        status
      }
      activationUrl
      expiresAt
    }
  }
`;
