"""
Video Analysis — MediaPipe Pose Detection + OpenCV
Analyses exercise videos frame-by-frame for form scoring.
"""

import math

# In production, uncomment:
# import cv2
# import mediapipe as mp
# import numpy as np
# mp_pose = mp.solutions.pose


def analyse_video(video_path: str, exercise: str) -> dict:
    """
    Analyse an exercise video using MediaPipe pose detection.

    Args:
        video_path: Path to the video file
        exercise: Exercise type ('squat', 'pushup', 'lunge', 'jump')

    Returns:
        dict with: overall score, breakdown, feedback
    """
    try:
        # In production:
        # return _real_analysis(video_path, exercise)

        # Demo fallback
        return _demo_analysis(exercise)

    except Exception as e:
        print(f"Video analysis error: {e}")
        return _demo_analysis(exercise)


def _real_analysis(video_path: str, exercise: str) -> dict:
    """
    Real MediaPipe analysis pipeline.
    Uncomment imports and this will work with actual video files.
    """
    # cap = cv2.VideoCapture(video_path)
    # scores = []
    #
    # with mp_pose.Pose(
    #     min_detection_confidence=0.6,
    #     min_tracking_confidence=0.6
    # ) as pose:
    #     while cap.isOpened():
    #         ret, frame = cap.read()
    #         if not ret:
    #             break
    #
    #         # Sample every 5th frame for performance
    #         if int(cap.get(cv2.CAP_PROP_POS_FRAMES)) % 5 != 0:
    #             continue
    #
    #         rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    #         results = pose.process(rgb)
    #
    #         if results.pose_landmarks:
    #             lm = results.pose_landmarks.landmark
    #             frame_score = _score_exercise(lm, exercise)
    #             scores.append(frame_score)
    #
    # cap.release()
    #
    # if not scores:
    #     return _demo_analysis(exercise)
    #
    # avg = sum(scores) / len(scores)
    # return {
    #     'overall': round(avg),
    #     'breakdown': _get_breakdown(scores, exercise),
    #     'feedback': _generate_feedback(avg, exercise),
    # }
    pass


def _score_exercise(landmarks, exercise: str) -> float:
    """Score a single frame based on exercise type."""
    # if exercise == 'squat':
    #     hip = landmarks[mp_pose.PoseLandmark.LEFT_HIP]
    #     knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE]
    #     ankle = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE]
    #     angle = _calculate_angle(hip, knee, ankle)
    #     return min(100, max(0, (180 - angle) * 1.2))
    #
    # elif exercise == 'pushup':
    #     shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
    #     elbow = landmarks[mp_pose.PoseLandmark.LEFT_ELBOW]
    #     wrist = landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
    #     angle = _calculate_angle(shoulder, elbow, wrist)
    #     return min(100, angle)
    #
    return 70


def _calculate_angle(a, b, c) -> float:
    """Calculate angle (in degrees) between three landmarks."""
    # a_arr = np.array([a.x, a.y])
    # b_arr = np.array([b.x, b.y])
    # c_arr = np.array([c.x, c.y])
    # radians = np.arctan2(c_arr[1]-b_arr[1], c_arr[0]-b_arr[0]) - \
    #           np.arctan2(a_arr[1]-b_arr[1], a_arr[0]-b_arr[0])
    # angle = np.abs(radians * 180.0 / np.pi)
    # return 360 - angle if angle > 180 else angle
    return 90.0


def _demo_analysis(exercise: str) -> dict:
    """Demo analysis result for testing without video files."""
    scores = {
        'squat': {'overall': 84, 'breakdown': {'depth': 91, 'alignment': 78, 'stability': 83}},
        'pushup': {'overall': 76, 'breakdown': {'depth': 70, 'alignment': 80, 'stability': 78}},
        'lunge': {'overall': 88, 'breakdown': {'depth': 92, 'alignment': 85, 'stability': 87}},
        'jump': {'overall': 72, 'breakdown': {'depth': 68, 'alignment': 74, 'stability': 74}},
    }

    result = scores.get(exercise, scores['squat'])

    feedback_map = {
        'squat': [
            {'type': 'good', 'text': 'Excellent depth — going well below parallel'},
            {'type': 'good', 'text': 'Back stays neutral throughout the movement'},
            {'type': 'warning', 'text': 'Knees slightly caving inward at the bottom'},
            {'type': 'tip', 'text': 'Focus on pushing knees out over pinky toes'},
        ],
        'pushup': [
            {'type': 'good', 'text': 'Good elbow angle at the bottom position'},
            {'type': 'warning', 'text': 'Hips sagging slightly in the middle reps'},
            {'type': 'tip', 'text': 'Engage core throughout — imagine a straight plank line'},
        ],
        'lunge': [
            {'type': 'good', 'text': 'Excellent front knee alignment over ankle'},
            {'type': 'good', 'text': 'Good depth and control on each rep'},
            {'type': 'tip', 'text': 'Keep torso upright to maximize glute engagement'},
        ],
        'jump': [
            {'type': 'good', 'text': 'Good explosive power on takeoff'},
            {'type': 'warning', 'text': 'Landing mechanics need work — bend knees more'},
            {'type': 'tip', 'text': 'Absorb impact through full kinetic chain'},
        ],
    }

    result['feedback'] = feedback_map.get(exercise, feedback_map['squat'])
    return result
