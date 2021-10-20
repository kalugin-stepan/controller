declare const io : {
    connect(): Socket;
    connect(url: string): Socket;
};
interface Socket {
    id: string;
    on(event: string, callback: (data: any) => void ): void;
    send(msg: any): void;
    emit(event: string, ...data: any[]): void;
    removeAllListeners(): void;
}