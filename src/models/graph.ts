/**
 * @module graph
 * @description Types and interfaces for Teamwork Graph curated queries, node pagination, and graph connections.
 */

export interface PageInfo {
  hasNextPage: boolean;
  endCursor?: string | null;
}

export interface GraphNode<T> {
  nodes: T[];
  pageInfo: PageInfo;
}

export interface LinkedConfluencePageNode {
  id: string;
  title: string;
}

export interface ConfluencePageOwnerNode {
  id: string;
  displayName: string;
}

export interface ConfluencePageLinkedPagesResponse {
  data?: {
    confluencePageLinkedConfluencePages?: GraphNode<LinkedConfluencePageNode>;
  };
  errors?: Array<{ message: string }>;
}

export interface ConfluencePageOwnersResponse {
  data?: {
    confluencePageOwners?: GraphNode<ConfluencePageOwnerNode>;
  };
  errors?: Array<{ message: string }>;
}

export interface TeamworkGraphQueryVariables {
  id: string;
  first?: number;
  after?: string;
}

