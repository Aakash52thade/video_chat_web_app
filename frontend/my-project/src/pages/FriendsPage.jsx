import { useQuery } from "@tanstack/react-query";
import { getUserFriends } from "../lib/api";
import { Link } from "react-router";
import { 
  MessageCircleIcon, 
  PhoneIcon, 
  UsersIcon, 
  SearchIcon,
  MapPinIcon 
} from "lucide-react";
import { useState } from "react";
import { getLanguageFlag } from "../components/FriendCard";
import { capitialize } from "../lib/utils";

const FriendsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  // Filter friends based on search term
  const filteredFriends = friends.filter(friend =>
    friend.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.nativeLanguage.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.learningLanguage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto">
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UsersIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                My Friends
              </h1>
              <p className="text-base-content opacity-70">
                {friends.length} {friends.length === 1 ? 'friend' : 'friends'} connected
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content opacity-50" />
          <input
            type="text"
            placeholder="Search friends by name or language..."
            className="input input-bordered w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Friends Grid */}
        {friends.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="h-16 w-16 mx-auto text-base-content opacity-30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Friends Yet</h3>
            <p className="text-base-content opacity-70 mb-6">
              Start connecting with language learners to build your network!
            </p>
            <Link to="/" className="btn btn-primary">
              Discover People
            </Link>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="text-center py-12">
            <SearchIcon className="h-16 w-16 mx-auto text-base-content opacity-30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Friends Found</h3>
            <p className="text-base-content opacity-70">
              Try adjusting your search terms.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFriends.map((friend) => (
              <FriendProfileCard key={friend._id} friend={friend} />
            ))}
          </div>
        )}

        {/* Stats */}
        {friends.length > 0 && (
          <div className="stats shadow w-full bg-base-200">
            <div className="stat">
              <div className="stat-figure text-primary">
                <UsersIcon className="w-8 h-8" />
              </div>
              <div className="stat-title">Total Friends</div>
              <div className="stat-value text-primary">{friends.length}</div>
            </div>
            
            <div className="stat">
              <div className="stat-figure text-secondary">
                <MessageCircleIcon className="w-8 h-8" />
              </div>
              <div className="stat-title">Active Conversations</div>
              <div className="stat-value text-secondary">{friends.length}</div>
              <div className="stat-desc">Ready to chat</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Individual Friend Card Component
const FriendProfileCard = ({ friend }) => {
  return (
    <div className="card bg-base-200 hover:shadow-lg transition-all duration-300 border border-base-300">
      <div className="card-body p-5 space-y-4">
        {/* Avatar and Name */}
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-16 h-16 rounded-full">
              <img 
                src={friend.profilePic} 
                alt={friend.fullName}
                className="object-cover"
              />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg truncate">{friend.fullName}</h3>
            {friend.location && (
              <div className="flex items-center text-xs opacity-70 mt-1">
                <MapPinIcon className="w-3 h-3 mr-1" />
                <span className="truncate">{friend.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="badge badge-secondary badge-sm">
              {getLanguageFlag(friend.nativeLanguage)}
              Native: {capitialize(friend.nativeLanguage)}
            </span>
            <span className="badge badge-outline badge-sm">
              {getLanguageFlag(friend.learningLanguage)}
              Learning: {capitialize(friend.learningLanguage)}
            </span>
          </div>
        </div>

        {/* Bio */}
        {friend.bio && (
          <p className="text-sm opacity-70 line-clamp-2">{friend.bio}</p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Link 
            to={`/chat/${friend._id}`}
            className="btn btn-primary btn-sm flex-1"
          >
            <MessageCircleIcon className="w-4 h-4 mr-1" />
            Chat
          </Link>
          <Link 
            to={`/call/${friend._id}`}
            className="btn btn-outline btn-sm"
          >
            <PhoneIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;