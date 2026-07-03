export interface Team extends TeamCreateBody {
  uid: string;
  // project: {
  //   uid: string;
  //   name: string;
  // };
  supervisor: {
    uid: string;
    name: string;
  };
  created_at: string;
}

export interface TeamCreateBody {
  name: string;
  supervisor_uid: string;
}

export interface TeamUpdateBody extends TeamCreateBody {
  uid: string;
}