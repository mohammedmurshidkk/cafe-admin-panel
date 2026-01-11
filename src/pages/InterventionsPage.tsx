import { useState, useEffect } from 'react';
import { InterventionList } from '../components/interventions/InterventionList';
import { InterventionDetail } from '../components/interventions/InterventionDetail';
import { ResponseForm } from '../components/interventions/ResponseForm';
import { Intervention } from '../store/api/interventionApi';
import { AlertCircle } from 'lucide-react';

const InterventionsPage = () => {
    const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

    const handleSuccess = () => {
        setSelectedIntervention(null);
    };

    return (
        <div className="h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
            {/* List Column */}
            <div className="w-full md:w-1/3 lg:w-1/4 h-full min-w-[300px]">
                <InterventionList
                    onSelect={setSelectedIntervention}
                    selectedId={selectedIntervention?.id}
                />
            </div>

            {/* Detail Column */}
            <div className="flex-1 h-full overflow-y-auto">
                {selectedIntervention ? (
                    <div className="max-w-3xl space-y-6">
                        <InterventionDetail intervention={selectedIntervention} />
                        <ResponseForm intervention={selectedIntervention} onSuccess={handleSuccess} />
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 border-2 border-dashed rounded-lg p-12">
                        <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-lg font-medium">No Intervention Selected</p>
                        <p className="text-sm opacity-60">Select an item from the list to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterventionsPage;
