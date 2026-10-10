package br.com.studymate.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Getter @Setter @NoArgsConstructor
@Entity @Table(name="email_verification")
public class EmailVerification {
 @Id @Column(name="token_hash",length=64,nullable=false) private String tokenHash;
 @Column(name="purpose",length=20,nullable=false) private String purpose;
 @Column(name="id_usuario") private Integer idUsuario;
 @Column(name="email",length=100,nullable=false) private String email;
 @Column(name="nome",length=100) private String nome;
 @Column(name="senha_hash",length=255) private String senhaHash;
 @Column(name="expires_at",nullable=false) private Instant expiresAt;
 @Column(name="used_at") private Instant usedAt;
}
