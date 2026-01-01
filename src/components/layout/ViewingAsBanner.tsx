import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@/store/store';
import { clearViewingBusiness } from '@/store/authSlice';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';

export const ViewingAsBanner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, viewingBusiness } = useSelector((state: RootState) => state.auth);

  // Only show for superadmin viewing a business
  if (user?.role !== 'superadmin' || !viewingBusiness) {
    return null;
  }

  const handleExit = () => {
    dispatch(clearViewingBusiness());
    navigate('/superadmin/businesses');
  };

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span className="text-sm font-medium">
          Viewing as: <strong>{viewingBusiness.name}</strong>
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-amber-950 hover:bg-amber-600 hover:text-amber-950"
        onClick={handleExit}
      >
        <X className="h-4 w-4 mr-1" />
        Exit
      </Button>
    </div>
  );
};
