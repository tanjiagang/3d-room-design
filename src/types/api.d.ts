declare namespace Api {
    interface Response<T = any> {
        code: number;
        data: T;
        message: string;
        timestamp: number;
    }

    type Pagination<T> = {
        list: T[];
        total: number;
        page: number;
        pageSize: number;
    }
}