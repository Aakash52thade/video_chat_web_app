
import toast from 'react-hot-toast';
import {useMutation, useQueryClient} from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser"; // Assuming you have a custom hook to get auth user
import {completeOnboarding} from "../lib/api.js";
import { useState } from 'react';
import { LoaderIcon, MapPinIcon, ShipWheelIcon, ShuffleIcon } from "lucide-react";
import {LANGUAGES} from "../constants"; // Assuming you have a languages constant 


const OnboardingPage = () => {
  const {authUser} = useAuthUser(); // Assuming you have a custom hook to get auth user
  const queryClient = useQueryClient();
 

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    learningLanguage: authUser?.learningLanguage || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "", 
  })

  //get the authentication user

  //mutate function and state const {mutatedFun, pendingState} = useMutation();
  // mutationFn = export completeOnboarding  mutation from lib 
  const {mutate: onboardingMutation, isPending} = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
        //if success toast.success
      toast.success("Onboarding completed successfully!");
      
      // 2nd then we refetch the authenticated state
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    //using this we know where and which filed has error 
      onError: (error) => {
      toast.error(error.response.data.message);
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault();
    onboardingMutation(formState); // Pass the form state to the mutation function
  }

  const handleRandomAvatar = () => {
    // Logic to generate a random avatar
    const idx = Math.floor(Math.random() * 100) + 1; // 1-100 included
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    setFormState({ ...formState, profilePic: randomAvatar });
    toast.success("Random profile picture generated!");
  }

  return (
    <div className='min-h-screen bg-base-100 flex items-center justify-center p-4 '>
      <div className='card bg-base-200 w-full max-w-3xl shadow-xl'> 
         <div className='card-body p-6 sm:p-8'>
            <h1 className="text-2xl font-bold sm:text-3xl text-center mb-6">Complete Your Profile</h1>

          <form onSubmit={handleSubmit} className='space-y-6'>
 
            {/* Profile pic container  */}
            <div className='flex flex-col items-center justify-center space-y-4'>
              {/* Image Preview  */}
              <div className='size-32 rounded-full bg-base-300 overflow-hidden'>
                {formState.profilePic ? (
                  <img 
                    src={formState.profilePic}
                    alt='Profile Preview'
                    className='w-full h-full object-cover'
                    />
                ) :(
                  <div className='flex items-center justify-center h-full'>
                     <CameraIcon className='size-12 text-base-content opacity-40' />
                  </div>
                )
                }
              </div>
              
              {/* Genrate Random Avatar btn  */}
              <div className=' flex items-center gap-2'>
                 <button type='button' onClick={handleRandomAvatar} className='btn btn-accent'>
                  <ShuffleIcon className='size-4 mr-2' />
                  Genrate Random Avatar
                 </button>
              </div>

              
              
            </div>

            {/* FullName  */}
              <div className='form-control'>
                 <label htmlFor="label">
                   <span className='label-text'>Full Name</span>
                 </label>
                 <input 
                    type='text'
                    name='fullName'
                    value={formState.fullName}
                    onChange={(e) => setFormState({...formState, fullName: e.target.value})}
                    className='input input-bordered w-full'
                    placeholder='Your Full Name'
                  />
              </div>

              {/* Bio  */}
               <div className='form-control'>
                 <label htmlFor="label">
                   <span className='label-text'>Bio</span>
                 </label>
                 <input 
                    type='text'
                    name='bio'
                    value={formState.bio}
                    onChange={(e) => setFormState({...formState, bio: e.target.value})}
                    className='input input-bordered w-full'
                    placeholder='Your Bio'
                  />
              </div>

              {/* Languages  */}
               <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Native Language */}
                  <div className='formm-control'>
                    <label className='label'>
                      <span className='label-text'>Native Language</span>
                    </label>
                    <select
                       name='nativeLanguage'
                       value={formState.nativeLanguage}
                       onChange={(e) => setFormState({ ...formState, nativeLanguage: e.target.value })}
                       className='select select-bordered w-full'
                     >
                      <option value=''>Select your native Language</option>
                       {LANGUAGES.map((lang) => ( 
                         <option key={`native-${lang}`} value={lang.toLowerCase()}>
                           {lang}
                         </option>
                       ))}
                    </select>
                  </div>

                  {/* Learning Language */}
                  <div className='formm-control'>
                     <label className='label'>
                        <span className='label-text'>Learning Language</span>
                     </label>
                     <select 
                         name='learningLanguage'
                         value={formState.learningLanguage}
                         onChange={(e) => setFormState({...formState, learningLanguage: e.target.value})}
                         className='select select-bordered w-full'
                       >
                        <option value=' '>Select Your Learning Language</option>
                           {LANGUAGES.map((lang) => (
                            <option key={`learning-${lang}`} value={lang.toLocaleLowerCase()}>
                              {lang}
                            </option>
                           ))}
                     </select>
                  </div>
               </div>

               {/* Location  */}
                <div className="form-control">
              <label className="label">
                <span className="label-text">Location</span>
              </label>
              <div className="relative">
               <MapPinIcon className="absolute top-1/2 -translate-y-1/2 left-3 size-5 stroke-current text-gray-500" />
                <input
                  type="text"
                  name="location"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  className="input input-bordered w-full pl-10"
                  placeholder="City, Country"
                />
              </div>
                </div>
 
                <button className='btn btn-primary w-full' disabled={isPending} type='submit'>
                  {!isPending ? (
                    <>
                      <ShipWheelIcon className='size-5 mr-2' />
                      Complete Onboarding
                    </>
                  ) :(
                    <>
                      <LoaderIcon className='animate-spin size-5' />
                       Onboarding...
                    </>
                  )}
                </button>

          </form>

         </div>
      </div>
    </div>
  )
}

export default OnboardingPage