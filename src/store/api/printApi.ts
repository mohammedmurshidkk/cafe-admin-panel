import { apiSlice } from './apiSlice';
import { GetPrintDataResponse, PrintData, PrintOutlet } from '@/types';

export const printApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getPrintData: builder.query<GetPrintDataResponse, string>({
            query: (orderId) => `/print/data/${orderId}`,
            providesTags: (result, error, orderId) => [{ type: 'Orders', id: orderId }],
        }),
        getPreview: builder.mutation<string, PrintData>({
            query: (data) => ({
                url: '/print/preview',
                method: 'POST',
                body: data,
                responseHandler: (response) => {
                    return response.text()
                },
            }),
        }),
        sendToPrinter: builder.mutation<{ success: boolean }, { orderId: string; outletId: string; printData: PrintData }>({
            query: ({ orderId, ...data }) => ({
                url: `/print/${orderId}`,
                method: 'POST',
                body: data,
            }),
        }),
        getOutletsWithPrinters: builder.query<PrintOutlet[], void>({
            query: () => '/print/outlets',
        }),
    }),
});

export const {
    useGetPrintDataQuery,
    useGetPreviewMutation,
    useSendToPrinterMutation,
    useGetOutletsWithPrintersQuery,
} = printApi;
