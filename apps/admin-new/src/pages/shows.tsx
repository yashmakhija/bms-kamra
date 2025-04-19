import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Calendar,
  Edit,
  Loader2,
  PlusCircle,
  RefreshCw,
  Search,
  Trash,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { useShowsStore } from "../store/shows";
import { useVenuesStore } from "../store/venues";
import { ShowtimeManager } from "../components/shows/ShowtimeManager";

interface ShowFormData {
  title: string;
  description: string;
  duration: number;
  imageUrl: string;
  thumbnailUrl: string;
  language: string;
  ageLimit?: number;
  venueId: string;
  isActive: boolean;
}

export function ShowsPage() {
  const {
    shows,
    isLoading,
    error,
    fetchShows,
    createShow,
    updateShow,
    deleteShow,
  } = useShowsStore();

  const { venues, isLoading: venuesLoading, fetchVenues } = useVenuesStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentShowId, setCurrentShowId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showManageSchedule, setShowManageSchedule] = useState(false);
  const [selectedShowId, setSelectedShowId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ShowFormData>({
    title: "",
    description: "",
    duration: 120,
    imageUrl: "",
    thumbnailUrl: "",
    language: "English",
    ageLimit: 13,
    venueId: "",
    isActive: true,
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchShows(), fetchVenues()]);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadData();
  }, [fetchShows, fetchVenues]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      duration: 120,
      imageUrl: "",
      thumbnailUrl: "",
      language: "English",
      ageLimit: 13,
      venueId: venues.length > 0 ? venues[0].id : "",
      isActive: true,
    });
    setIsEditMode(false);
    setCurrentShowId(null);
  };

  const handleOpenModal = (show?: any) => {
    if (show) {
      setFormData({
        title: show.title,
        description: show.description || "",
        duration: show.duration,
        imageUrl: show.imageUrl || "",
        thumbnailUrl: show.thumbnailUrl || "",
        language: show.language || "English",
        ageLimit: show.ageLimit || 13,
        venueId: show.venueId,
        isActive: show.isActive !== undefined ? show.isActive : true,
      });
      setIsEditMode(true);
      setCurrentShowId(show.id);
    } else {
      resetForm();
      setIsEditMode(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData({
        ...formData,
        [name]: value === "" ? undefined : Number(value),
      });
    } else if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditMode && currentShowId) {
        await updateShow(currentShowId, formData);
      } else {
        await createShow(formData);
      }

      handleCloseModal();
      fetchShows(); // Refresh the shows list
    } catch (error) {
      console.error("Error submitting show:", error);
    }
  };

  const handleDeleteShow = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this show?")) {
      try {
        await deleteShow(id);
        fetchShows(); // Refresh the shows list
      } catch (error) {
        console.error("Error deleting show:", error);
      }
    }
  };

  const handleManageSchedule = (showId: string) => {
    setSelectedShowId(showId);
    setShowManageSchedule(true);
  };

  const handleCloseScheduleManager = () => {
    setShowManageSchedule(false);
    setSelectedShowId(null);
  };

  const filteredShows = shows.filter((show) => {
    return (
      show.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (show.description &&
        show.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (show.language &&
        show.language.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  if (isLoading || venuesLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
          <span className="text-zinc-500">Loading shows...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-md w-full">
          <div className="flex items-center text-rose-600 text-lg font-medium mb-2">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Error</span>
          </div>
          <p className="text-zinc-700">{error}</p>
          <button
            onClick={fetchShows}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (showManageSchedule && selectedShowId) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6 pt-24">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">
                Manage Schedule
              </h1>
              <p className="text-zinc-500 mt-1">
                Add events, showtimes, and seat sections for this show
              </p>
            </div>
            <Button variant="outline" onClick={handleCloseScheduleManager}>
              Back to Shows
            </Button>
          </header>
          <ShowtimeManager showId={selectedShowId} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Shows</h1>
          <p className="text-zinc-500 mt-1">
            Manage all comedy shows for Kunal Kamra
          </p>
        </header>

        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search shows..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchShows()}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Show
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-zinc-500"
                    >
                      {searchTerm
                        ? "No shows matching your search"
                        : "No shows found. Create your first show!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShows.map((show) => (
                    <TableRow key={show.id}>
                      <TableCell className="font-medium">
                        {show.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-zinc-400" />
                          {show.duration} mins
                        </div>
                      </TableCell>
                      <TableCell>{show.language}</TableCell>
                      <TableCell>
                        {venues.find((v) => v.id === show.venueId)?.name ||
                          "Unknown Venue"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={show.isActive ? "default" : "secondary"}
                          className={
                            show.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : ""
                          }
                        >
                          {show.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageSchedule(show.id)}
                            title="Manage Schedule"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModal(show)}
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={() => handleDeleteShow(show.id)}
                            title="Delete"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Show" : "Create New Show"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update the show's information and settings"
                  : "Enter the details to create a new show"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (mins)</Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      value={formData.duration}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) =>
                        handleSelectChange("language", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="Hinglish">Hinglish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageLimit">Age Limit</Label>
                    <Input
                      id="ageLimit"
                      name="ageLimit"
                      type="number"
                      value={formData.ageLimit || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                    <Input
                      id="thumbnailUrl"
                      name="thumbnailUrl"
                      value={formData.thumbnailUrl}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venueId">Venue</Label>
                  <Select
                    value={formData.venueId}
                    onValueChange={(value) =>
                      handleSelectChange("venueId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {venues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("isActive", checked as boolean)
                    }
                  />
                  <Label htmlFor="isActive">
                    Show is active and visible to users
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditMode ? "Update Show" : "Create Show"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
