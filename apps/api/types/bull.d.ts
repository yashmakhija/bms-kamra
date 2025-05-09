declare module "bull" {
  export interface JobOptions {
    priority?: number;
    delay?: number;
    attempts?: number;
    repeat?: RepeatOptions;
    backoff?: BackoffOptions;
    lifo?: boolean;
    timeout?: number;
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
    stackTraceLimit?: number;
    jobId?: string;
  }

  export interface RepeatOptions {
    cron?: string;
    tz?: string;
    startDate?: Date | string | number;
    endDate?: Date | string | number;
    limit?: number;
    every?: number;
    count?: number;
  }

  export interface BackoffOptions {
    type: string;
    delay: number;
  }

  export interface QueueOptions {
    limiter?: {
      max: number;
      duration: number;
    };
    redis?: {
      port?: number;
      host?: string;
      password?: string;
      db?: number;
      tls?: object;
    };
    prefix?: string;
    defaultJobOptions?: JobOptions;
    settings?: {
      stalledInterval?: number;
      maxStalledCount?: number;
      guardInterval?: number;
      retryProcessDelay?: number;
      drainDelay?: number;
    };
  }

  export interface Job<T = any> {
    id: string;
    data: T;
    opts: JobOptions;
    progress(progress: number): Promise<void>;
    progress(): Promise<number>;
    getState(): Promise<string>;
    update(data: T): Promise<void>;
    remove(): Promise<void>;
    retry(): Promise<void>;
    finished(): Promise<void>;
    moveToCompleted(returnValue: any, token: string): Promise<void>;
    moveToFailed(errorInfo: Error, token: string): Promise<void>;
  }

  export interface Queue<T = any> {
    add(data: T, opts?: JobOptions): Promise<Job<T>>;
    add(name: string, data: T, opts?: JobOptions): Promise<Job<T>>;
    process(processor: (job: Job<T>) => Promise<any>): void;
    process(
      concurrency: number,
      processor: (job: Job<T>) => Promise<any>
    ): void;
    process(name: string, processor: (job: Job<T>) => Promise<any>): void;
    process(
      name: string,
      concurrency: number,
      processor: (job: Job<T>) => Promise<any>
    ): void;
    count(): Promise<number>;
    getJob(jobId: string): Promise<Job<T> | null>;
    getJobs(
      types: string[],
      start?: number,
      end?: number,
      asc?: boolean
    ): Promise<Job<T>[]>;
    getCompleted(start?: number, end?: number): Promise<Job<T>[]>;
    getFailed(start?: number, end?: number): Promise<Job<T>[]>;
    getActive(start?: number, end?: number): Promise<Job<T>[]>;
    getWaiting(start?: number, end?: number): Promise<Job<T>[]>;
    getDelayed(start?: number, end?: number): Promise<Job<T>[]>;
    clean(grace: number, type?: string, limit?: number): Promise<number>;
    empty(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    close(): Promise<void>;
    removeRepeatable(name?: string, repeat?: RepeatOptions): Promise<void>;
    on(event: string, callback: (...args: any[]) => void): void;
  }

  export default function Queue<T = any>(
    name: string,
    options?: QueueOptions
  ): Queue<T>;
}
