'use client';

import React, { useState, useEffect } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
// NOTE: You must create these functions in your services/db.ts file
import { getReviewsByPostId, addReview } from '../services/db';
import { useAuth } from '../context/AuthContext';
// NOTE: You must define the 'Review' type in your types.ts file
import { Review } from '../types';

interface ReviewSectionProps {
  postId: string;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        size={16}
        className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}
      />
    );
  }
  return <div className="flex space-x-0.5">{stars}</div>;
};

const ReviewSection: React.FC<ReviewSectionProps> = ({ postId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  useEffect(() => {
    fetchReviews();
  }, [postId]);

  const fetchReviews = async () => {
    setLoading(true);
    // @ts-ignore - Assuming getReviewsByPostId exists and returns Review[]
    const fetchedReviews = await getReviewsByPostId(postId);
    setReviews(fetchedReviews);
    setLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!user || !newReviewText.trim()) return;

    const reviewData = {
      postId: postId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      rating: newReviewRating,
      content: newReviewText.trim(),
      createdAt: new Date().toISOString(),
    };

    // @ts-ignore - Assuming addReview exists and works
    await addReview(reviewData);

    // Optimistically update the local state
    setReviews([
      { ...reviewData, id: `temp-${Date.now()}` } as Review,
      ...reviews
    ]);
    setNewReviewText('');
    setNewReviewRating(5);
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  const totalReviews = reviews.length;

  return (
    <div id="reviews-section" className="mt-5 pt-6 ">


      {loading ? (
        <div className="flex justify-center py-8 dark:text-white"><Loader2 className="animate-spin mr-2" /> Loading Reviews...</div>
      ) : (
        <>
          {/* Review Submission Form */}
          {user ? (
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="flex items-center mb-3">
                <Image
                  src={user.avatar}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="rounded-full mr-3 object-cover"
                />
                <span className="font-bold text-gray-900 dark:text-white">{user.name}</span>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Rating:</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      aria-label={`Rate ${star} stars`}
                      className="focus:outline-none focus:scale-110 transition-transform"
                    >
                      <Star
                        size={24}
                        className={`transition-colors ${star <= newReviewRating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                rows={4}
                placeholder="Share your experience and review this post..."
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
              ></textarea>

              <button
                onClick={handleSubmitReview}
                disabled={!newReviewText.trim()}
                className="mt-3 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center"
              >
                <Send size={16} className="mr-2" /> Submit Review
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl mb-8 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">Log in to leave a review.</p>
              <Link href="/login" className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">
                Log In
              </Link>
            </div>
          )}

          {/* List of Reviews */}
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 border-b border-gray-100 dark:border-gray-800 pb-6 last:border-b-0">
                <Image
                  src={review.userAvatar}
                  alt={review.userName}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
                <div className='flex-1'>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 dark:text-white">{review.userName}</span>
                    <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mb-2">
                    <StarRating rating={review.rating} />
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{review.content}</p>

                  {/* Admin Reply */}
                  {review.adminReply && (
                    <div className="mt-4 ml-4 pl-4 border-l-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 p-3 rounded-r-lg">
                      <p className="text-sm font-semibold text-primary-900 dark:text-primary-300 mb-1">
                        Reply from {review.adminReply.adminName}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">{review.adminReply.content}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(review.adminReply.repliedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-gray-500 text-center py-4">No reviews yet. Be the first to share your experience!</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewSection;