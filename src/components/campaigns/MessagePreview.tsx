import React, { useMemo } from 'react';
import { CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Template } from '@/store/api/campaignsApi';

interface MessagePreviewProps {
    image?: string | File | null;
    headerValue?: string; // For dynamic text headers
    bodyParameters: string[];
    template?: Template | null;
    // Fallbacks for history view
    headerText?: string;
    bodyText?: string;
    footerText?: string;
    className?: string;
}

export const MessagePreview = ({
    image,
    headerValue,
    bodyParameters,
    template,
    headerText,
    bodyText,
    footerText,
    className,
}: MessagePreviewProps) => {
    const imageUrl = useMemo(() => {
        if (image instanceof File) {
            return URL.createObjectURL(image);
        }
        return image;
    }, [image]);

    const components = useMemo(() => {
        if (!template) {
            return {
                header: headerText || '',
                body: bodyText || '',
                footer: footerText || '',
                headerFormat: image ? 'IMAGE' : 'TEXT'
            };
        }

        const header = template.components.find((c) => c.type === 'HEADER');
        const body = template.components.find((c) => c.type === 'BODY');
        const footer = template.components.find((c) => c.type === 'FOOTER');

        const replacePlaceholders = (text: string, params: string[]) => {
            let result = text;
            const matches = text.match(/{{([^}]+)}}/g);
            if (!matches) return result;

            matches.forEach((fullMatch, index) => {
                // If we have a value for this position, substitute it
                // Otherwise leave it as is or show placeholder
                if (index < params.length && params[index]) {
                    // We replace only the first occurrence of this specific match string if we iterate?
                    // No, invalid logic if duplicates exist like {{name}} ... {{name}}.
                    // But standard approach is index based mapping for bodyParameters.
                    // If text is "{{event}} ... {{brand}}", params[0] is for event, params[1] is for brand.

                    // To do this correctly without replacing all instances of {{event}} with the first param:
                    // We should split or build string manually. But simple replace of first occurrence works if we iterate order.

                    // Actually, replace() only replaces the first match by default.
                    // So if we iterate matches in order, we can replace the first occurrence of that strings each time?
                    // Wait, if result changes, we might replace something we just inserted? No, user input won't have {{}} usually.

                    // Safer: Use a replacer function on the whole string?
                    // But we need to map nth {{}} to nth param.
                }
            });

            // Better Approach: use replace with a counter
            let matchIndex = 0;
            return text.replace(/{{([^}]+)}}/g, (match) => {
                const val = params[matchIndex];
                matchIndex++;
                return val ? val : match; // Keep placeholder if no value
            });
        };

        // For headers, if it's dynamic text, we might need to handle it differently
        // but usually user provides the whole text or it has variables.
        // Based on parameterInfo.headerParams
        let renderedHeader = header?.text || '';
        if (template.parameterInfo.headerType === 'TEXT' && template.parameterInfo.headerParams > 0) {
            renderedHeader = headerValue || '[Header Text]';
        }

        const renderedBody = body ? replacePlaceholders(body.text || '', bodyParameters) : '';
        const renderedFooter = footer?.text || '';

        return {
            header: renderedHeader,
            body: renderedBody,
            footer: renderedFooter,
            headerFormat: header?.format,
        };
    }, [template, headerValue, bodyParameters, headerText, bodyText, footerText, image]);

    return (
        <div className={cn('flex flex-col items-center', className)}>
            <div className="w-[300px] bg-[#e5ddd5] rounded-[40px] border-[12px] border-slate-900 overflow-hidden relative shadow-xl">
                {/* Notch / Camera */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-10" />

                {/* Screen Content */}
                <div className="h-[500px] flex flex-col pt-8">
                    {/* Header */}
                    <div className="bg-[#075e54] text-white p-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-400" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">Business Account</p>
                            <p className="text-[10px] opacity-70">Online</p>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-2">
                        {/* Outbound Bubble */}
                        <div className="max-w-[90%] bg-white rounded-lg rounded-tl-none p-2 shadow-sm ml-auto relative">
                            {/* Media Header */}
                            {components?.headerFormat === 'IMAGE' && imageUrl && (
                                <div className="mb-2 rounded overflow-hidden aspect-video bg-slate-100">
                                    <img src={imageUrl} alt="Message image" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                {/* Text Header */}
                                {components?.header && (
                                    <div className="text-[14px] font-bold text-slate-900 leading-tight">
                                        {components.header}
                                    </div>
                                )}

                                {/* Body Text */}
                                <div className="text-[13px] text-slate-800 whitespace-pre-wrap leading-relaxed pr-6">
                                    {components?.body || 'Select a template to see preview...'}
                                </div>

                                {/* Footer Text */}
                                {components?.footer && (
                                    <div className="text-[11px] text-slate-400 leading-tight">
                                        {components.footer}
                                    </div>
                                )}
                            </div>

                            <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                <span className="text-[9px] text-slate-400">12:34 PM</span>
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                            </div>

                            {/* Bubble Tail */}
                            <div className="absolute top-1 -right-[6px] w-0 h-0 border-t-[8px] border-t-white border-r-[8px] border-r-transparent" />
                        </div>
                    </div>

                    {/* Footer / Input (Non-functional) */}
                    <div className="bg-[#f0f2f5] p-2 flex items-center gap-2">
                        <div className="flex-1 h-8 bg-white rounded-full"></div>
                        <div className="w-8 h-8 rounded-full bg-[#128c7e] flex items-center justify-center">
                            <div className="w-4 h-4 text-white">➤</div>
                        </div>
                    </div>
                </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                WhatsApp Preview
            </p>
        </div>
    );
};
