package com.openqa.platform.service;

import com.openqa.platform.dto.LoginRequest;
import com.openqa.platform.dto.RegisterRequest;
import com.openqa.platform.dto.AuthResponse;
import com.openqa.platform.dto.UserDTO;
import com.openqa.platform.entity.User;
import com.openqa.platform.exception.BadRequestException;
import com.openqa.platform.exception.ResourceNotFoundException;
import com.openqa.platform.repository.UserRepository;
import com.openqa.platform.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Transactional
    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email Address already in use!");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .reputation(10) // Start reputation
                .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=" + request.getUsername())
                .roles(new HashSet<>(Collections.singletonList("USER")))
                .badges(new HashSet<>())
                .build();

        return userRepository.save(user);
    }

    public AuthResponse authenticateUser(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return AuthResponse.builder()
                .accessToken(jwt)
                .userId(user.getId())
                .username(user.getUsername())
                .roles(user.getRoles())
                .reputation(user.getReputation())
                .build();
    }

    public UserDTO getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return mapToDTO(user);
    }

    public List<UserDTO> getLeaderboard() {
        return userRepository.findAll().stream()
                .sorted((u1, u2) -> Integer.compare(u2.getReputation(), u1.getReputation()))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateUserReputation(User user, int reputationChange) {
        user.setReputation(Math.max(1, user.getReputation() + reputationChange));
        
        // Auto badge assignment based on reputation
        if (user.getReputation() >= 100) {
            user.getBadges().add("Stellar Contributor");
        }
        if (user.getReputation() >= 200) {
            user.getBadges().add("Top Scholar");
        }
        
        userRepository.save(user);
    }

    @Transactional
    public void addBadgeToUser(User user, String badge) {
        if (!user.getBadges().contains(badge)) {
            user.getBadges().add(badge);
            userRepository.save(user);
        }
    }

    public UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .bio(user.getBio())
                .reputation(user.getReputation())
                .avatarUrl(user.getAvatarUrl())
                .badges(user.getBadges())
                .roles(user.getRoles())
                .build();
    }
}
